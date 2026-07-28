import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { Search } from 'lucide-react';

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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  const getBulan = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pencarian Live Data SP2D</h2>
        <p className="text-gray-500 mt-1 flex items-center space-x-2">
          <span>Pencarian otomatis di seluruh kolom</span>
          <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            {isKeuangan ? 'Akses Keuangan (Semua Bidang)' : `Bidang: ${userBidang}`}
          </span>
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm font-medium"
            placeholder="Ketik langsung untuk mencari No SP2D, SPM, Rekanan, Pekerjaan, dll..."
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 mt-6">
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
      ) : (
        <div className="bg-white shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col mt-6 rounded-xl">
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
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap border-b-2 border-gray-300">Bulan</th>
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
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.id} onClick={() => setSelectedItem(row)} className="hover:bg-blue-50/50 transition-colors divide-x divide-gray-200 cursor-pointer">
                      <td className="px-2 py-1.5 whitespace-nowrap text-center text-gray-500 bg-gray-50">{row.no}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.tglAntarBerkas}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{getBulan(row.tglAntarBerkas)}</td>
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

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-800/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col z-10">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Detail Data SP2D</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] overflow-x-hidden">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 text-sm break-words">
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Antar Berkas</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{selectedItem.tglAntarBerkas || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">No SPM</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-all">{selectedItem.noSpm || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Rekanan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-words">{selectedItem.namaRekanan || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Kwitansi</dt>
                  <dd className="mt-1 font-semibold text-blue-600 text-base">{formatCurrency(selectedItem.nilaiKwitansi)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bidang</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{selectedItem.bidang || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Sub Kegiatan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-all">{selectedItem.kodeSubKegiatan || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Cair SP2D</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{selectedItem.tglCairSp2d || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">No SP2D</dt>
                  <dd className="mt-1 font-semibold text-green-600 break-all bg-green-50/50 p-2.5 rounded-lg border border-green-100">{selectedItem.noSp2d || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pekerjaan / Keterangan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 break-words">{selectedItem.pekerjaan || '-'}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="inline-flex justify-center rounded-lg border border-gray-300 px-5 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
