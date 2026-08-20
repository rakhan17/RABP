import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToCollection, getFromFirestore } from '../lib/firestoreService';
import type { SppData, SpmData, Sp2dData, MergedRekapData } from '../types';

interface DataContextType {
  sppData: SppData[];
  spmData: SpmData[];
  sp2dData: Sp2dData[];
  mergedRekapData: MergedRekapData[];
  
  allSppData: SppData[];
  allSpmData: SpmData[];
  allSp2dData: Sp2dData[];
  
  loading: boolean;
  errorMsg: string;
  refreshData: () => Promise<void>;
  isKeuangan: boolean;
  userBidang: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allSppData, setAllSppData] = useState<SppData[]>([]);
  const [allSpmData, setAllSpmData] = useState<SpmData[]>([]);
  const [allSp2dData, setAllSp2dData] = useState<Sp2dData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const isKeuangan = user?.username?.toLowerCase() === 'keuangan' || user?.bidang?.toLowerCase() === 'keuangan';
  const userBidang = user?.bidang || '';

  // Filter dataset synchronously based on Bidang scoping
  const sppData = useMemo(() => {
    if (isKeuangan || !userBidang) return allSppData;
    const ub = userBidang.toLowerCase().trim();
    return allSppData.filter((item) => item.unitSkpd?.toLowerCase().trim() === ub || item.bidang?.toLowerCase().trim() === ub);
  }, [allSppData, isKeuangan, userBidang]);

  const spmData = useMemo(() => {
    if (isKeuangan || !userBidang) return allSpmData;
    const ub = userBidang.toLowerCase().trim();
    return allSpmData.filter((item) => item.unitSkpd?.toLowerCase().trim() === ub);
  }, [allSpmData, isKeuangan, userBidang]);

  const sp2dData = useMemo(() => {
    if (isKeuangan || !userBidang) return allSp2dData;
    const ub = userBidang.toLowerCase().trim();
    return allSp2dData.filter((item) => item.unitSkpd?.toLowerCase().trim() === ub);
  }, [allSp2dData, isKeuangan, userBidang]);

  // Merge Data for Rekap Data
  const mergedRekapData = useMemo(() => {
    const getKey = (ket: string, nama: string) => `${(ket||'').trim().toLowerCase()}_${(nama||'').trim().toLowerCase()}`;
    
    // 1. Group SP2D by key, since it can have multiple records per key (taxes)
    const sp2dMap = new Map<string, Sp2dData[]>();
    sp2dData.forEach(sp2d => {
      const key = getKey(sp2d.keterangan, sp2d.namaPenerima);
      if (!sp2dMap.has(key)) sp2dMap.set(key, []);
      sp2dMap.get(key)!.push(sp2d);
    });

    // 2. Build base SPP/SPM map
    const baseMap = new Map<string, Partial<MergedRekapData>>();
    
    // Add SPP
    sppData.forEach(spp => {
      const key = getKey(spp.keterangan, spp.namaPenerima);
      baseMap.set(key, {
        id: spp.id, // primary id
        keterangan: spp.keterangan,
        namaPenerima: spp.namaPenerima,
        tanggalSpp: spp.tanggalSpp,
        nomorSpp: spp.nomorSpp,
        sppUnitSkpd: spp.unitSkpd,
        unitSkpd: spp.unitSkpd,
        jenisSpp: spp.jenisSpp,
        bidang: spp.bidang,
        subKegiatan: spp.subKegiatan,
        nilaiBruto: spp.nilaiBruto,
        nilaiPotongan: spp.nilaiPotongan,
        nilaiNeto: spp.nilaiNeto,
      });
    });

    // Merge SPM
    spmData.forEach(spm => {
      const key = getKey(spm.keterangan, spm.namaPenerima);
      const existing = baseMap.get(key) || {
        id: spm.id,
        keterangan: spm.keterangan,
        namaPenerima: spm.namaPenerima,
        nilaiBruto: spm.nilaiBruto,
        nilaiPotongan: spm.nilaiPotongan,
        nilaiNeto: spm.nilaiNeto,
      };
      existing.tanggalSpm = spm.tanggalSpm;
      existing.nomorSpm = spm.nomorSpm;
      existing.spmUnitSkpd = spm.unitSkpd;
      existing.unitSkpd = existing.unitSkpd || spm.unitSkpd;
      existing.jenisSpm = spm.jenisSpm;
      baseMap.set(key, existing);
    });

    // 3. Combine baseMap and sp2dMap to create final array
    const finalData: Partial<MergedRekapData>[] = [];
    const processedSp2dKeys = new Set<string>();

    baseMap.forEach((base, key) => {
      const sp2ds = sp2dMap.get(key);
      if (sp2ds && sp2ds.length > 0) {
        processedSp2dKeys.add(key);
        // Duplicate base for each SP2D record
        sp2ds.forEach((sp2d, index) => {
          finalData.push({
            ...base,
            id: index === 0 ? base.id : `${base.id}_sp2d_${index}`,
            tanggalSp2dPembuatan: sp2d.tanggalSp2dPembuatan,
            tanggalSp2dPencairan: sp2d.tanggalSp2dPencairan,
            nomorSp2d: sp2d.nomorSp2d,
            sp2dUnitSkpd: sp2d.unitSkpd,
            unitSkpd: base.unitSkpd || sp2d.unitSkpd,
            jenisSp2d: sp2d.jenisSp2d,
            pajakJenis: sp2d.pajakJenis,
            pajakNama: sp2d.pajakNama,
            pajakJumlah: sp2d.pajakJumlah,
            kodeBiling: sp2d.kodeBiling,
            nomorNtpn: sp2d.nomorNtpn,
          });
        });
      } else {
        // No SP2D data for this base record
        finalData.push(base);
      }
    });

    // Add remaining SP2D records that didn't have any SPP/SPM match
    sp2dMap.forEach((sp2ds, key) => {
      if (!processedSp2dKeys.has(key)) {
        sp2ds.forEach(sp2d => {
          finalData.push({
            id: sp2d.id,
            keterangan: sp2d.keterangan,
            namaPenerima: sp2d.namaPenerima,
            tanggalSp2dPembuatan: sp2d.tanggalSp2dPembuatan,
            tanggalSp2dPencairan: sp2d.tanggalSp2dPencairan,
            nomorSp2d: sp2d.nomorSp2d,
            sp2dUnitSkpd: sp2d.unitSkpd,
            unitSkpd: sp2d.unitSkpd,
            jenisSp2d: sp2d.jenisSp2d,
            pajakJenis: sp2d.pajakJenis,
            pajakNama: sp2d.pajakNama,
            pajakJumlah: sp2d.pajakJumlah,
            kodeBiling: sp2d.kodeBiling,
            nomorNtpn: sp2d.nomorNtpn,
          });
        });
      }
    });

    return finalData as MergedRekapData[];
  }, [sppData, spmData, sp2dData]);

  useEffect(() => {
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 3) setLoading(false);
    };

    const unsubSpp = subscribeToCollection<SppData>('spp_data', (data) => {
      setAllSppData(data);
      checkLoaded();
    }, (err) => console.error(err));

    const unsubSpm = subscribeToCollection<SpmData>('spm_data', (data) => {
      setAllSpmData(data);
      checkLoaded();
    }, (err) => console.error(err));

    const unsubSp2d = subscribeToCollection<Sp2dData>('sp2d_data', (data) => {
      setAllSp2dData(data);
      checkLoaded();
    }, (err) => console.error(err));

    return () => {
      unsubSpp();
      unsubSpm();
      unsubSp2d();
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [spp, spm, sp2d] = await Promise.all([
        getFromFirestore<SppData>('spp_data'),
        getFromFirestore<SpmData>('spm_data'),
        getFromFirestore<Sp2dData>('sp2d_data')
      ]);
      setAllSppData(spp);
      setAllSpmData(spm);
      setAllSp2dData(sp2d);
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      setErrorMsg(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        sppData, spmData, sp2dData, mergedRekapData,
        allSppData, allSpmData, allSp2dData,
        loading, errorMsg, refreshData, isKeuangan, userBidang,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
