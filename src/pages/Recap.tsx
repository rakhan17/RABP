import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { MergedRekapData } from '../types';
import { FileDown, Download, Filter, Table2 } from 'lucide-react';
import { BINDANG_LIST, SUB_KEGIATAN_LIST } from '../lib/users';
import * as XLSX from 'xlsx';

const getBulanName = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) {
    return parts[1]; // Mengembalikan bulan (misal "Agustus")
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('id-ID', { month: 'long' });
  }
  return dateStr;
};

export default function Recap() {
  const { type } = useParams<{ type: string }>();
  const isAntarBerkas = type === 'antar-berkas';
  const recapType = isAntarBerkas ? 'antar_berkas' : 'pencairan_sp2d';

  const { mergedRekapData, loading, isKeuangan, userBidang } = useData();
  const [filteredData, setFilteredData] = useState<MergedRekapData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filters
  const [bidang, setBidang] = useState(isKeuangan ? '' : userBidang);
  const [customTglAntar, setCustomTglAntar] = useState('');
  const [filterTglSpm, setFilterTglSpm] = useState('');
  const [bulan, setBulan] = useState('');
  const [kodeSubKegiatan, setKodeSubKegiatan] = useState('');
  const [filterNoSpm, setFilterNoSpm] = useState('');

  // Get distinct Nomor SPM for the dropdown
  const uniqueNoSpm = Array.from(new Set(mergedRekapData.map(item => item.nomorSpm).filter(Boolean))).sort();

  useEffect(() => {
    if (!isKeuangan && userBidang) {
      setBidang(userBidang);
    }
  }, [isKeuangan, userBidang]);

  useEffect(() => {
    let result = mergedRekapData;

    const parseIndoDate = (dateStr: string) => {
      if (!dateStr) return '';
      const months: Record<string, string> = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
        'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
      };
      const parts = dateStr.trim().toLowerCase().split(' ');
      if (parts.length === 3) {
        return `${parts[2]}-${months[parts[1]] || '01'}-${parts[0].padStart(2, '0')}`;
      }
      return dateStr;
    };

    const isFiltered = bidang || filterNoSpm || bulan || kodeSubKegiatan || filterTglSpm;

    if (isFiltered) {
      result = result.filter((item) => {
        // Pertahankan data yang sudah dicentang (selected) meskipun filter berubah
        const rowId = item.id || item.nomorSpm || '';
        if (selectedRows.has(rowId)) return true;

        if (bidang) {
          const bNorm = bidang.toLowerCase().trim();
          if (!item.bidang || item.bidang.toLowerCase().trim() !== bNorm) return false;
        }

        if (filterNoSpm) {
          if (!item.nomorSpm || item.nomorSpm !== filterNoSpm) return false;
        }

        if (recapType === 'pencairan_sp2d') {
          if (bulan) {
            const dateStr = item.tanggalSp2dPembuatan || item.tanggalSpm;
            if (!dateStr) return false;
            const yyyymmdd = parseIndoDate(dateStr);
            if (!yyyymmdd.split('-')[1] || yyyymmdd.split('-')[1] !== bulan) return false;
          }
          if (kodeSubKegiatan) {
            if (!item.subKegiatan || item.subKegiatan.trim() !== kodeSubKegiatan) return false;
          }
        } else {
          if (filterTglSpm) {
            if (!item.tanggalSpm || parseIndoDate(item.tanggalSpm) !== filterTglSpm) return false;
          }
        }

        return true;
      });
    }

    setFilteredData(result);
  }, [bidang, bulan, kodeSubKegiatan, filterNoSpm, filterTglSpm, mergedRekapData, recapType, selectedRows]);

  const toggleRowSelection = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(d => d.id || d.nomorSpm || Math.random().toString())));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    let exportData: any[] = [];
    let wscols: any[] = [];
    let sheetName = '';

    if (recapType === 'antar_berkas') {
      sheetName = 'Rekap Antar Berkas';
      exportData = filteredData.map((item, index) => {
        const bulanCalc = getBulanName(item.tanggalSpm);
        return {
        'No.': index + 1,
        'Tanggal SPM': item.tanggalSpm || '',
        'Bulan': bulanCalc,
        'No. SPM': item.nomorSpm || '',
        'Nama Rekanan': item.namaPenerima || '',
        'Nilai Kwitansi (Rp)': item.nilaiBruto || 0,
        'Keterangan': item.keterangan || '',
        };
      });
      wscols = [{ wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 22 }, { wch: 45 }];
    } else {
      sheetName = 'Rekap Pencairan SP2D';
      exportData = filteredData.map((item, index) => {
        const bulanCalc = getBulanName(item.tanggalSp2dPembuatan || item.tanggalSpm);
        return {
        'No.': index + 1,
        'Bulan': bulanCalc,
        'No. SPM': item.nomorSpm || '',
        'Nama Rekanan': item.namaPenerima || '',
        'Nilai Kwitansi (Rp)': item.nilaiBruto || 0,
        'Nama Bidang': item.bidang || '',
        'Kode Sub Kegiatan': item.subKegiatan || '',
        'Keterangan': item.keterangan || '',
        'No. SP2D': item.nomorSp2d || '',
        'Tanggal Cair SP2D': item.tanggalSp2dPencairan || '',
        };
      });
      wscols = [
        { wch: 6 }, { wch: 12 }, { wch: 30 },
        { wch: 22 }, { wch: 25 }, { wch: 20 }, { wch: 45 },
        { wch: 25 }, { wch: 18 },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const cleanBidang = (bidang || userBidang || 'Semua_Bidang').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sheetName.replace(/\s+/g, '_')}_${cleanBidang}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const downloadPDF = () => {
    window.print();
  };

  const totalNilaiKwitansi = filteredData.reduce((sum, item) => sum + (Number(item.nilaiBruto) || 0), 0);

  return (
    <div className="space-y-6 font-sans print-container p-6 bg-[#f8f9fa] h-full overflow-y-auto custom-scrollbar print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-6 no-print print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-[#e9eef6] flex items-center justify-center text-[#0b57d0]">
              <Table2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[22px] font-normal text-[#1f1f1f] leading-tight">
                {isAntarBerkas ? 'Rekap Antar Berkas' : 'Rekap Pencairan SP2D'}
              </h3>
              <p className="text-[14px] text-[#444746] mt-0.5">Filter, Ekspor, atau Cetak Laporan</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDF}
              disabled={loading || filteredData.length === 0}
              className="flex items-center space-x-2 bg-[#e9eef6] text-[#0b57d0] hover:bg-[#d3e3fd] disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all ripple shadow-sm"
            >
              <Download className="h-4 w-4" strokeWidth={2.5} />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all ripple shadow-sm"
            >
              <FileDown className="h-4 w-4" strokeWidth={2.5} />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-[14px] font-medium text-[#1f1f1f] mb-4">
            <Filter className="h-4 w-4 text-[#444746]" />
            <span>Kriteria Filter</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Pilih Bidang</label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                disabled={!isKeuangan}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">-- Semua Bidang --</option>
                {BINDANG_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            
            {recapType === 'antar_berkas' && (
              <div>
                <label className="block text-[13px] font-medium text-[#444746] mb-1.5">No. SPM</label>
                <input
                  list="spm-list"
                  placeholder="-- Ketik / Cari No SPM --"
                  value={filterNoSpm}
                  onChange={(e) => setFilterNoSpm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
                />
                <datalist id="spm-list">
                  {uniqueNoSpm.map((spm) => (
                    <option key={spm} value={spm} />
                  ))}
                </datalist>
              </div>
            )}

            {recapType === 'pencairan_sp2d' ? (
              <>
                <div>
                  <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Bulan</label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
                  >
                    <option value="">-- Semua Bulan --</option>
                    {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, '0')}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Kode Sub Kegiatan</label>
                  <select
                    value={kodeSubKegiatan}
                    onChange={(e) => setKodeSubKegiatan(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
                  >
                    <option value="">-- Semua Sub Kegiatan --</option>
                    {SUB_KEGIATAN_LIST.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Filter Tanggal SPM (Untuk Tabel)</label>
                  <input
                    type="date"
                    value={filterTglSpm}
                    onChange={(e) => setFilterTglSpm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Tanggal Antar Berkas (Untuk Cetak)</label>
                  <input
                    type="text"
                    placeholder="Misal: 25 Agustus 2026"
                    value={customTglAntar}
                    onChange={(e) => setCustomTglAntar(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="hidden print:block print-header mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-black uppercase">
          Laporan {recapType === 'antar_berkas' ? 'Rekapitulasi Antar Berkas' : 'Rekapitulasi Pencairan SP2D'}
        </h1>
        {recapType === 'antar_berkas' && customTglAntar && (
          <p className="text-sm text-gray-800 mt-1 font-medium">
            Tanggal Antar: {customTglAntar}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm print-fullscreen print:rounded-none print:shadow-none print:border-black print:overflow-visible">
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center no-print print:hidden">
          <div className="text-[16px] font-medium text-[#1f1f1f]">
            Data {recapType === 'antar_berkas' ? 'Rekap Antar Berkas' : 'Rekap Pencairan SP2D'}
          </div>
          <div className="flex items-center space-x-4 text-[14px]">
            <span className="text-[#444746]">
              Total: <span className="text-[#444746] font-bold ml-1">{formatCurrency(totalNilaiKwitansi)}</span>
            </span>
            <span className="bg-[#e9eef6] text-[#0b57d0] text-[13px] font-medium px-3 py-1 rounded-full">
              {filteredData.length} Data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar print-table-wrapper print:overflow-visible">
          {recapType === 'antar_berkas' ? (
            <table className="min-w-full text-left border-collapse print:border print:border-black">
              <thead className="bg-white text-[12px] font-semibold text-[#444746] border-b border-gray-200 print:static print:border-b-black print:text-black">
                <tr>
                  <th className="px-5 py-4 font-medium text-center w-12 print:hidden">
                    <input type="checkbox" onChange={toggleAllSelection} checked={filteredData.length > 0 && selectedRows.size === filteredData.length} />
                  </th>
                  <th className="px-5 py-4 font-medium text-center w-12">No</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Tgl SPM</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bulan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SPM</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-5 py-4 font-medium text-right whitespace-nowrap">Nilai Kwitansi (Bruto)</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 bg-white print:divide-black/50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm text-[#444746]">
                      Tidak ada data rekapitulasi yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const bulanCalc = getBulanName(row.tanggalSpm);
                    const rowId = row.id || row.nomorSpm || idx.toString();
                    const isSelected = selectedRows.has(rowId);
                    
                    // In print mode, if any row is selected, hide unselected rows.
                    const printHiddenClass = selectedRows.size > 0 && !isSelected ? 'print:hidden' : '';

                    return (
                    <tr key={rowId} className={`hover:bg-[#f8f9fa] transition-colors print:break-inside-avoid ${printHiddenClass}`}>
                      <td className="px-5 py-3.5 text-center text-[#444746] text-[13px] print:hidden">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRowSelection(rowId)} />
                      </td>
                      <td className="px-5 py-3.5 text-center text-[#444746] text-[13px]">{idx + 1}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[13px] text-[#444746]">{row.tanggalSpm || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746]">{bulanCalc}</td>
                      <td className="px-5 py-3.5 font-medium text-[13px] text-[#0b57d0] whitespace-nowrap">{row.nomorSpm || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] truncate max-w-[200px] print:max-w-none">{row.namaPenerima || '-'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[13px] text-[#444746] whitespace-nowrap print:text-black">{formatCurrency(row.nilaiBruto)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[300px] print:max-w-none print:whitespace-normal">{row.keterangan || '-'}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-white border-t border-gray-200">
                  <tr>
                    <td className="px-5 py-4 print:hidden"></td>
                    <td colSpan={5} className="px-5 py-4 text-right text-[13px] font-medium text-[#444746]">
                      Total Kwitansi:
                    </td>
                    <td className="px-5 py-4 text-right text-[#444746] text-[14px] font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td className="px-5 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="min-w-full text-left border-collapse print:border print:border-black">
              <thead className="bg-white text-[12px] font-semibold text-[#444746] border-b border-gray-200 print:static print:border-b-black print:text-black">
                <tr>
                  <th className="px-5 py-4 font-medium text-center w-12">No</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bulan</th>

                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-5 py-4 font-medium text-right whitespace-nowrap">Nilai Kwitansi</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Bidang</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Sub Kegiatan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Keterangan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SP2D</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Tgl Cair SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 bg-white print:divide-black/50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-sm text-[#444746]">
                      Tidak ada data rekapitulasi yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const bulanCalc = getBulanName(row.tanggalSp2dPembuatan || row.tanggalSpm);
                    return (
                    <tr key={row.id || idx} className="hover:bg-[#f8f9fa] transition-colors print:break-inside-avoid">
                      <td className="px-5 py-3.5 text-center text-[#444746] text-[13px]">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746]">{bulanCalc}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] truncate max-w-[180px] print:max-w-none">{row.namaPenerima || '-'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[13px] text-[#444746] whitespace-nowrap print:text-black">{formatCurrency(row.nilaiBruto)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[140px] print:max-w-none">{row.bidang || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{row.subKegiatan || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[240px] print:max-w-none print:whitespace-normal">{row.keterangan || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] whitespace-nowrap print:text-black">{row.nomorSp2d || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{row.tanggalSp2dPencairan || '-'}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-white border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-4 text-right text-[13px] font-medium text-[#444746]">
                      Total Kwitansi:
                    </td>
                    <td className="px-5 py-4 text-right text-[#444746] text-[14px] font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td colSpan={5} className="px-5 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
