import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { Search } from 'lucide-react';

export default function SearchSp2d() {
  const { data, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData([]);
      setHasSearched(false);
      return;
    }

    const query = searchQuery.toLowerCase();
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
    setHasSearched(true);
  }, [searchQuery, data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pencarian Data SP2D</h2>
        <p className="text-gray-500 mt-1">Cari berdasarkan No SP2D atau No SPM</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              placeholder="Cari berdasarkan No SP2D, SPM, Rekanan, Bulan, dll..."
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
            disabled={loading}
          >
            {loading ? 'Memuat Data...' : 'Cari'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 mt-6">
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
      ) : hasSearched && (
        <div className="bg-white shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col mt-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-800">Hasil Pencarian</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filteredData.length} data ditemukan
            </span>
          </div>
          
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-300 text-xs border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr className="divide-x divide-gray-300">
                  <th className="px-2 py-1.5 text-center font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 w-12">No</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Tgl Antar Berkas</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">No SPM</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 min-w-[150px]">Nama Rekanan</th>
                  <th className="px-3 py-1.5 text-right font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Nilai Kwitansi</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bidang</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Sub Kegiatan</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300 min-w-[200px]">Pekerjaan</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">No SP2D</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Tgl Cair SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                      Tidak ada data yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors divide-x divide-gray-200">
                      <td className="px-2 py-1.5 whitespace-nowrap text-center text-gray-500 bg-gray-50 hover:bg-blue-100/50">{row.no}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.tglAntarBerkas}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap font-medium text-gray-800">{row.noSpm}</td>
                      <td className="px-3 py-1.5 truncate max-w-[200px]" title={row.namaRekanan}>{row.namaRekanan}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-right font-medium text-blue-600">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-3 py-1.5 truncate max-w-[150px]" title={row.bidang}>{row.bidang}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.kodeSubKegiatan}</td>
                      <td className="px-3 py-1.5 truncate max-w-[250px]" title={row.pekerjaan}>{row.pekerjaan}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap font-medium text-green-600">{row.noSp2d}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-gray-500">{row.tglCairSp2d}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
