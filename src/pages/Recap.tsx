import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { BINDANG_LIST } from '../lib/users';
import { FileDown, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Recap() {
  const { data, loading } = useData();
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);
  
  // Filters
  const [bidang, setBidang] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  useEffect(() => {
    const parseIdDate = (dateStr: string) => {
      if (!dateStr) return '';
      // If already in YYYY-MM-DD (e.g. from input)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
      
      const months: { [key: string]: string } = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
        'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
      };
      
      // format: "5 Januari 2026"
      const parts = dateStr.toLowerCase().split(' ');
      if (parts.length >= 3) {
        let day = parts[0];
        if (day.length === 1) day = '0' + day;
        const month = months[parts[1]] || '01';
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      
      // If it's an ISO date string (like Tanggal Cair SP2D)
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };

    // Apply filters
    let result = data;
    if (bidang) {
      result = result.filter(item => item.bidang === bidang);
    }
    if (tglMulai) {
      result = result.filter(item => {
        const itemDate = parseIdDate(item.tglAntarBerkas);
        return itemDate >= tglMulai;
      });
    }
    if (tglSelesai) {
      result = result.filter(item => {
        const itemDate = parseIdDate(item.tglAntarBerkas);
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

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    // Format data for Excel
    const exportData = filteredData.map((item, index) => ({
      'No.': index + 1,
      'No. SPM': item.noSpm,
      'Nama Rekanan': item.namaRekanan,
      'Nilai Kwitansi': item.nilaiKwitansi,
      'Pekerjaan': item.pekerjaan
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const wscols = [
      { wch: 5 }, // No.
      { wch: 20 }, // No. SPM
      { wch: 30 }, // Nama Rekanan
      { wch: 20 }, // Nilai Kwitansi
      { wch: 40 }, // Pekerjaan
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Antar Berkas');
    
    // Generate filename
    const filename = `Rekap_Antar_Berkas_${bidang || 'Semua_Bidang'}_${new Date().getTime()}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 h-full flex flex-col print-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rekap Antar Berkas</h2>
          <p className="text-gray-500 mt-1">Filter dan unduh rekapitulasi data ke format Excel/PDF</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={downloadPDF}
            disabled={loading || filteredData.length === 0}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
          >
            <Download className="h-5 w-5" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredData.length === 0}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
          >
            <FileDown className="h-5 w-5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-300 flex-shrink-0 no-print">
        <div className="flex items-center space-x-2 mb-4 text-gray-700 font-medium">
          <Filter className="h-5 w-5" />
          <h3>Filter Data</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bidang</label>
            <select
              value={bidang}
              onChange={(e) => setBidang(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 p-2.5 sm:text-sm"
            >
              <option value="">Semua Bidang</option>
              {BINDANG_LIST.filter(b => b !== 'Keuangan').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal (Antar Berkas)</label>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 p-2.5 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal (Antar Berkas)</label>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 p-2.5 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col min-h-0 print-fullscreen">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0 no-print">
          <h3 className="text-lg font-medium text-gray-800">Data Rekapitulasi</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredData.length} data
          </span>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar bg-white">
          <table className="min-w-full divide-y divide-gray-300 text-xs border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr className="divide-x divide-gray-300">
                <th className="px-2 py-1.5 text-center font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 w-12">No</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bulan</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bidang</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Sub Kegiatan</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 min-w-[200px]">Pekerjaan</th>
                <th className="px-3 py-1.5 text-right font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Nilai Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left" 
                             style={{ width: '100%', animationName: 'progress-bar' }}></div>
                      </div>
                      <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat data...</p>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                    Belum ada data untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                <>
                  {filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors divide-x divide-gray-200">
                      <td className="px-2 py-1.5 whitespace-nowrap text-center text-gray-500 bg-gray-50 hover:bg-blue-100/50">{row.no}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{getBulan(row.tglAntarBerkas)}</td>
                      <td className="px-3 py-1.5 truncate max-w-[150px]" title={row.bidang}>{row.bidang}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.kodeSubKegiatan}</td>
                      <td className="px-3 py-1.5 truncate max-w-[250px]" title={row.pekerjaan}>{row.pekerjaan}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-right font-medium text-blue-600">{formatCurrency(row.nilaiKwitansi)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300 divide-x divide-gray-300">
                    <td colSpan={5} className="px-3 py-2 text-right">TOTAL</td>
                    <td className="px-3 py-2 text-right text-blue-700">{formatCurrency(filteredData.reduce((sum, item) => sum + (item.nilaiKwitansi || 0), 0))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
