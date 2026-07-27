import React, { useState, useEffect } from 'react';
import { getRegistrations } from '../lib/db';
import { Sp2dRegistration } from '../types';
import { Search } from 'lucide-react';

export default function SearchSp2d() {
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getRegistrations();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredData([]);
      setHasSearched(true);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = data.filter((item) => {
      return (
        (item.noSp2d && item.noSp2d.toLowerCase().includes(query)) ||
        (item.noSpm && item.noSpm.toLowerCase().includes(query))
      );
    });

    setFilteredData(results);
    setHasSearched(true);
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
              placeholder="Masukkan No SP2D / No SPM..."
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

      {hasSearched && !loading && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Hasil Pencarian</h3>
            <span className="text-sm text-gray-500">{filteredData.length} data ditemukan</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Tgl Antar Berkas</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">No SPM</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Nama Rekanan</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Nilai Kwitansi</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Kode Sub Kegiatan</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 min-w-[200px] bg-gray-50">Pekerjaan</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">No SP2D</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 whitespace-nowrap bg-gray-50">Tanggal Cair SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      Data tidak ditemukan. Silakan gunakan kata kunci lain.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{row.tglAntarBerkas}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{row.noSpm}</td>
                      <td className="px-6 py-4 text-gray-700">{row.namaRekanan}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{row.kodeSubKegiatan}</td>
                      <td className="px-6 py-4 text-gray-600">{row.pekerjaan}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{row.noSp2d || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.tglCairSp2d || '-'}</td>
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
