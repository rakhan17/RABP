import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { BINDANG_LIST } from '../lib/users';
import { FileDown, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Recap() {
  const { data, loading, isKeuangan, userBidang } = useData();
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);

  // Filters
  const [bidang, setBidang] = useState(isKeuangan ? '' : userBidang);
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  // Lock bidang for non-Keuangan users
  useEffect(() => {
    if (!isKeuangan && userBidang) {
      setBidang(userBidang);
    }
  }, [isKeuangan, userBidang]);

  useEffect(() => {
    const parseToIsoDate = (dateStr: string) => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

      const months: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
      };

      const parts = dateStr.toLowerCase().split(/\s+/);
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }

      return dateStr;
    };

    let result = data;

    // Filter by Bidang if selected or locked
    if (bidang) {
      const bNorm = bidang.toLowerCase().trim();
      result = result.filter((item) => item.bidang && item.bidang.toLowerCase().trim() === bNorm);
    }

    // Filter by Date Range (Tanggal Antar Berkas)
    if (tglMulai) {
      result = result.filter((item) => {
        const itemDate = parseToIsoDate(item.tglAntarBerkas);
        return itemDate >= tglMulai;
      });
    }

    if (tglSelesai) {
      result = result.filter((item) => {
        const itemDate = parseToIsoDate(item.tglAntarBerkas);
        return itemDate && itemDate <= tglSelesai;
      });
    }

    setFilteredData(result);
  }, [bidang, tglMulai, tglSelesai, data]);

  const getBulan = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  // Full Matching Excel Export
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    const exportData = filteredData.map((item, index) => ({
      'No.': index + 1,
      'Tanggal Antar Berkas': item.tglAntarBerkas,
      'Bulan': getBulan(item.tglAntarBerkas),
      'No. SPM': item.noSpm,
      'Nama Rekanan': item.namaRekanan,
      'Nilai Kwitansi (Rp)': item.nilaiKwitansi,
      'Nama Bidang': item.bidang,
      'Kode Sub Kegiatan': item.kodeSubKegiatan,
      'Pekerjaan / Keterangan': item.pekerjaan,
      'No. SP2D': item.noSp2d,
      'Tanggal Cair SP2D': item.tglCairSp2d,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const wscols = [
      { wch: 6 },  // No
      { wch: 18 }, // Tgl Antar
      { wch: 15 }, // Bulan
      { wch: 20 }, // No SPM
      { wch: 30 }, // Nama Rekanan
      { wch: 22 }, // Nilai Kwitansi
      { wch: 25 }, // Bidang
      { wch: 20 }, // Sub Kegiatan
      { wch: 45 }, // Pekerjaan
      { wch: 25 }, // No SP2D
      { wch: 18 }, // Tgl Cair
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap SP2D');

    const cleanBidang = (bidang || userBidang || 'Semua_Bidang').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Rekap_SP2D_${cleanBidang}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const downloadPDF = () => {
    window.print();
  };

  const totalNilaiKwitansi = filteredData.reduce((sum, item) => sum + (Number(item.nilaiKwitansi) || 0), 0);

  return (
    <div className="space-y-6 flex-1 flex flex-col print-container">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 no-print gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rekapitulasi Data SP2D</h2>
          <p className="text-gray-500 mt-1 flex items-center space-x-2">
            <span>Filter dan ekspor rekapitulasi data ke PDF / Excel</span>
            <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full text-xs">
              {isKeuangan ? 'Akses Keuangan' : `Bidang: ${userBidang}`}
            </span>
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={downloadPDF}
            disabled={loading || filteredData.length === 0}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-semibold text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredData.length === 0}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-semibold text-xs"
          >
            <FileDown className="h-4 w-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Panel (Hidden on Print) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-300 flex-shrink-0 no-print">
        <div className="flex items-center space-x-2 mb-4 text-gray-700 font-semibold text-sm">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Filter Rekapitulasi Data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Bidang</label>
            <select
              value={bidang}
              onChange={(e) => setBidang(e.target.value)}
              disabled={!isKeuangan}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-gray-50 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 font-medium"
            >
              <option value="">-- Semua Bidang --</option>
              {BINDANG_LIST.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Tanggal (Antar Berkas)</label>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-gray-50 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sampai Tanggal (Antar Berkas)</label>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-gray-50 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {(bidang || tglMulai || tglSelesai) && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => {
                if (isKeuangan) setBidang('');
                setTglMulai('');
                setTglSelesai('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Title Header (Only visible on print) */}
      <div className="hidden print:block print-header mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-black uppercase">Laporan Rekapitulasi Register Antar Berkas dan Pencairan SP2D</h1>
        <p className="text-xs text-gray-600 mt-1">
          Bidang: <span className="font-semibold">{bidang || 'Semua Bidang'}</span> | Periode:{' '}
          <span className="font-semibold">
            {tglMulai ? tglMulai : 'Awal'} s/d {tglSelesai ? tglSelesai : 'Akhir'}
          </span>
        </p>
      </div>

      {/* Data Table Container */}
      <div className="bg-white shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col min-h-0 print-fullscreen rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0 no-print">
          <h3 className="text-base font-bold text-gray-800">Tabel Rekapitulasi Data</h3>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-gray-600">
              Total Kwitansi: <span className="text-blue-700 font-bold">{formatCurrency(totalNilaiKwitansi)}</span>
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredData.length} Data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar print-table-wrapper">
          <table className="min-w-full divide-y divide-gray-300 text-xs border-collapse w-full">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-xs print:static">
              <tr className="divide-x divide-gray-300">
                <th className="px-2 py-1.5 text-center font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 w-10">No</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Tgl Antar Berkas</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bulan</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">No SPM</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Nama Rekanan</th>
                <th className="px-3 py-1.5 text-right font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Nilai Kwitansi</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bidang</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Sub Kegiatan</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 min-w-[200px]">Pekerjaan</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">No SP2D</th>
                <th className="px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Tgl Cair SP2D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"
                          style={{ width: '100%', animationName: 'progress-bar' }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat data dari Firebase...</p>
                      <style>{`
                        @keyframes progress-bar {
                          0% { transform: translateX(-100%); }
                          50% { transform: translateX(0); }
                          100% { transform: translateX(100%); }
                        }
                      `}</style>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data rekapitulasi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors divide-x divide-gray-200 print:break-inside-avoid">
                    <td className="px-2 py-1.5 whitespace-nowrap text-center text-gray-500 bg-gray-50 print:bg-transparent">{idx + 1}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{row.tglAntarBerkas}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{getBulan(row.tglAntarBerkas)}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-medium text-gray-800">{row.noSpm}</td>
                    <td className="px-3 py-1.5 truncate max-w-[200px] print:max-w-none print:whitespace-normal">{row.namaRekanan}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-right font-medium text-blue-600 print:text-black">{formatCurrency(row.nilaiKwitansi)}</td>
                    <td className="px-3 py-1.5 truncate max-w-[150px] print:max-w-none">{row.bidang}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{row.kodeSubKegiatan}</td>
                    <td className="px-3 py-1.5 truncate max-w-[250px] print:max-w-none print:whitespace-normal">{row.pekerjaan}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-medium text-green-600 print:text-black">{row.noSp2d}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-500">{row.tglCairSp2d}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Row */}
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 font-bold text-gray-800 border-t-2 border-gray-300">
                <tr className="divide-x divide-gray-300">
                  <td colSpan={5} className="px-4 py-2.5 text-right uppercase tracking-wider">
                    Total Nilai Kwitansi ({filteredData.length} Data):
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-700 print:text-black text-sm font-bold">
                    {formatCurrency(totalNilaiKwitansi)}
                  </td>
                  <td colSpan={5} className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
