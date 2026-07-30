import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { Search, X, CheckCircle2 } from 'lucide-react';

export default function SearchSp2d() {
  const { data, loading, isKeuangan, userBidang } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);
  const [selectedItem, setSelectedItem] = useState<Sp2dRegistration | null>(null);

  // Live search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = data.filter((item) => {
      return (
        (item.noSp2d && String(item.noSp2d).toLowerCase().includes(query)) ||
        (item.noSpm && String(item.noSpm).toLowerCase().includes(query)) ||
        (item.namaRekanan && String(item.namaRekanan).toLowerCase().includes(query)) ||
        (item.bidang && String(item.bidang).toLowerCase().includes(query)) ||
        (item.kodeSubKegiatan && String(item.kodeSubKegiatan).toLowerCase().includes(query)) ||
        (item.pekerjaan && String(item.pekerjaan).toLowerCase().includes(query)) ||
        (item.tglAntarBerkas && String(item.tglAntarBerkas).toLowerCase().includes(query)) ||
        (item.tglCairSp2d && String(item.tglCairSp2d).toLowerCase().includes(query)) ||
        (item.nilaiKwitansi && String(item.nilaiKwitansi).includes(query))
      );
    });

    setFilteredData(results);
  }, [searchQuery, data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 font-sans p-6 h-full flex flex-col bg-[#f8f9fa]">
      {/* Minimalist Search Header & Input */}
      <div className="flex-shrink-0 flex justify-center pt-2 pb-4">
        <div className="w-full max-w-3xl relative">
          <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_1px_6px_rgba(32,33,36,0.15)] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.2)] transition-shadow duration-200">
            <div className="pl-5 pr-2 py-3.5">
              <Search className="h-[22px] w-[22px] text-gray-500" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 px-2 bg-transparent text-[16px] text-[#1f1f1f] placeholder-gray-500 focus:outline-none"
              placeholder="Cari No SP2D, SPM, Rekanan, Pekerjaan..."
            />
            {searchQuery && (
              <div className="pr-4 pl-2 py-3.5">
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 px-4 text-xs font-medium text-[#444746]">
            <span>
              {isKeuangan ? 'Pencarian Global (Semua Bidang)' : `Pencarian Terbatas (Bidang: ${userBidang})`}
            </span>
            <span>
              Ditemukan <strong className="text-[#0b57d0]">{filteredData.length}</strong> data
            </span>
          </div>
        </div>
      </div>

      {/* Clean Results Table */}
      {loading ? (
        <div className="py-20 text-center text-sm font-medium text-[#444746] animate-pulse">
          Memuat data pencarian...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-20 text-center text-sm text-[#444746] bg-white rounded-3xl border border-gray-200 shadow-sm mx-auto w-full max-w-4xl">
          Tidak ada hasil untuk pencarian ini.
        </div>
      ) : (
        <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-white text-[12px] font-semibold text-[#444746] border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bulan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SPM</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-5 py-4 font-medium text-right whitespace-nowrap">Nilai Kwitansi</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bidang</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Sub Kegiatan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Keterangan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SP2D</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Tgl Cair SP2D</th>
                  <th className="px-5 py-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {filteredData.map((item) => {
                  const bulanCalc = item.tglAntarBerkas ? new Date(item.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-';
                  return (
                  <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors group">
                    <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{bulanCalc}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-[#0b57d0] whitespace-nowrap">{item.noSpm || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] max-w-[200px] truncate">{item.namaRekanan || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-right font-semibold text-[#444746] whitespace-nowrap">{formatCurrency(item.nilaiKwitansi)}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{item.bidang || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{item.kodeSubKegiatan || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[#444746] max-w-[250px] truncate">{item.pekerjaan || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] whitespace-nowrap">{item.noSp2d || '-'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{item.tglCairSp2d || '-'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button 
                        onClick={() => setSelectedItem(item)} 
                        className="text-[12px] font-medium bg-transparent group-hover:bg-[#e9eef6] text-[#0b57d0] px-4 py-1.5 rounded-full transition-colors ripple"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Google M3 Detail Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1f1f1f]/40 backdrop-blur-[2px] transition-opacity" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col z-10">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-[#e9eef6] flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-[#0b57d0]" />
                </div>
                <h4 className="text-[24px] font-normal text-[#1f1f1f] leading-tight">Detail SP2D</h4>
                <p className="text-[14px] text-[#444746] mt-1">Informasi lengkap transaksi</p>
              </div>
            </div>
            
            <div className="px-8 pb-4 overflow-y-auto max-h-[60vh] space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-[12px] font-medium text-[#444746] mb-1">Bulan</dt>
                  <dd className="text-[15px] font-medium text-[#1f1f1f]">
                    {selectedItem.tglAntarBerkas ? new Date(selectedItem.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-medium text-[#444746] mb-1">No SPM</dt>
                  <dd className="text-[15px] font-medium text-[#0b57d0]">{selectedItem.noSpm || '-'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-[12px] font-medium text-[#444746] mb-1">Nama Rekanan</dt>
                <dd className="text-[16px] font-medium text-[#1f1f1f]">{selectedItem.namaRekanan || '-'}</dd>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-[12px] font-medium text-[#444746] mb-1">Nilai Kwitansi</dt>
                  <dd className="text-[16px] font-semibold text-[#444746]">{formatCurrency(selectedItem.nilaiKwitansi)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-medium text-[#444746] mb-1">Bidang</dt>
                  <dd className="text-[15px] font-medium text-[#1f1f1f]">{selectedItem.bidang || '-'}</dd>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-4 rounded-2xl border border-gray-100">
                <dt className="text-[12px] font-medium text-[#444746] mb-1">No SP2D & Tanggal</dt>
                <dd className="text-[15px] font-medium text-[#1f1f1f] break-all">
                  {selectedItem.noSp2d || '-'} <span className="text-gray-400 mx-2">•</span> {selectedItem.tglCairSp2d || '-'}
                </dd>
              </div>

              <div>
                <dt className="text-[12px] font-medium text-[#444746] mb-1">Pekerjaan / Keterangan</dt>
                <dd className="text-[14px] text-[#1f1f1f] leading-relaxed">{selectedItem.pekerjaan || '-'}</dd>
              </div>
            </div>
            
            <div className="px-8 py-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2.5 bg-transparent hover:bg-[#e9eef6] text-[14px] font-medium text-[#0b57d0] rounded-full transition-colors ripple"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
