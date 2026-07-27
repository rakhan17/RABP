import { useState, useEffect } from 'react';
import { getRegistrations } from '../lib/sheets';
import type { Sp2dRegistration } from '../types';
import { BINDANG_LIST } from '../lib/users';
import { FileDown, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Recap() {
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [bidang, setBidang] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getRegistrations();
        setData(result);
        setFilteredData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = data;
    if (bidang) {
      result = result.filter(item => item.bidang === bidang);
    }
    if (tglMulai) {
      result = result.filter(item => item.tglAntarBerkas >= tglMulai);
    }
    if (tglSelesai) {
      result = result.filter(item => item.tglAntarBerkas <= tglSelesai);
    }
    setFilteredData(result);
  }, [bidang, tglMulai, tglSelesai, data]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rekap Antar Berkas</h2>
          <p className="text-gray-500 mt-1">Filter dan unduh rekapitulasi data ke format Excel</p>
        </div>
        
        <button
          onClick={handleExportExcel}
          disabled={loading || filteredData.length === 0}
          className="mt-4 sm:mt-0 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
        >
          <FileDown className="h-5 w-5" />
          <span>Download Excel</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Pratinjau Rekap</h3>
          <span className="text-sm text-gray-500 font-medium bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
            Total Data: {filteredData.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50 w-16">No.</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">No. SPM</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Nama Rekanan</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Nilai Kwitansi</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 bg-gray-50">Pekerjaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Memuat Data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Tidak ada data yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{row.noSpm}</td>
                    <td className="px-6 py-4 text-gray-700">{row.namaRekanan}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{formatCurrency(row.nilaiKwitansi)}</td>
                    <td className="px-6 py-4 text-gray-600">{row.pekerjaan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
