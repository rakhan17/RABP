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
    <div className="space-y-5 font-sans">
      {/* Minimalist Search Header & Input */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-[#0f9d58]" />
            <h3 className="text-sm font-bold text-gray-800">Cari Data SP2D</h3>
          </div>
          <span className="text-[11px] font-medium text-gray-500">
            {isKeuangan ? 'Akses Semua Bidang' : `Bidang: ${userBidang}`}
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f9d58] transition-all"
            placeholder="Ketik No SP2D, SPM, Rekanan, Pekerjaan, dll..."
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
          <span>
            Ditemukan: <strong className="text-[#0f9d58] font-bold">{filteredData.length}</strong> data
          </span>
          {searchQuery && (
            <span className="bg-emerald-50 text-[#0f9d58] px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-emerald-200">
              "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Clean Results Table */}
      {loading ? (
        <div className="py-12 text-center text-xs font-medium text-gray-400 animate-pulse">
          Memuat data pencarian...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-200">
          Tidak ada data yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-xs border-collapse">
              <thead className="bg-gray-50 font-semibold text-gray-600 uppercase tracking-wider text-[10px]">
                <tr className="divide-x divide-gray-200">
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2 text-left">No SPM</th>
                  <th className="px-3 py-2 text-left">Nama Rekanan</th>
                  <th className="px-3 py-2 text-right">Nilai Kwitansi</th>
                  <th className="px-3 py-2 text-left">Bidang</th>
                  <th className="px-3 py-2 text-left">No SP2D</th>
                  <th className="px-3 py-2 text-left">Pekerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredData.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedItem(row)}
                    className="hover:bg-emerald-50/60 transition-colors cursor-pointer divide-x divide-gray-100"
                  >
                    <td className="px-3 py-2.5 text-center text-gray-400 font-mono text-[11px] bg-gray-50/50">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-gray-800">{row.noSpm || '-'}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900 truncate max-w-[180px]">{row.namaRekanan || '-'}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">{formatCurrency(row.nilaiKwitansi)}</td>
                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[140px]">{row.bidang || '-'}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">{row.noSp2d || '-'}</td>
                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[220px]">{row.pekerjaan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clean Detail Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col z-10 border border-gray-200">
            <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#0f9d58]" />
                <span>Detail Data SP2D</span>
              </h4>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[70vh] text-xs space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] uppercase font-bold text-gray-400">Tgl Antar Berkas</dt>
                  <dd className="mt-0.5 font-semibold text-gray-800">{selectedItem.tglAntarBerkas || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-bold text-gray-400">No SPM</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-gray-800">{selectedItem.noSpm || '-'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-[10px] uppercase font-bold text-gray-400">Nama Rekanan</dt>
                <dd className="mt-0.5 font-bold text-sm text-gray-900">{selectedItem.namaRekanan || '-'}</dd>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] uppercase font-bold text-gray-400">Nilai Kwitansi</dt>
                  <dd className="mt-0.5 font-bold text-emerald-700 text-sm">{formatCurrency(selectedItem.nilaiKwitansi)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-bold text-gray-400">Bidang</dt>
                  <dd className="mt-0.5 font-semibold text-gray-800">{selectedItem.bidang || '-'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-[10px] uppercase font-bold text-gray-400">No SP2D</dt>
                <dd className="mt-0.5 font-mono font-bold text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-200 break-all">{selectedItem.noSp2d || '-'}</dd>
              </div>

              <div>
                <dt className="text-[10px] uppercase font-bold text-gray-400">Pekerjaan / Keterangan</dt>
                <dd className="mt-0.5 font-medium text-gray-800 bg-gray-50 p-2.5 rounded border border-gray-200 leading-relaxed">{selectedItem.pekerjaan || '-'}</dd>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-white border border-gray-300 text-xs font-semibold text-gray-700 rounded hover:bg-gray-100 transition-colors"
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
