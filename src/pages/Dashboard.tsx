import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Sp2dRegistration } from '../types';
import { getRegistrations, addRegistration, updateRegistration, deleteRegistration } from '../lib/sheets';
import { BINDANG_LIST } from '../lib/users';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tglAntarBerkas: '',
    noSpm: '',
    namaRekanan: '',
    nilaiKwitansi: '',
    bidang: '',
    kodeSubKegiatan: '',
    pekerjaan: '',
    noSp2d: '',
    tglCairSp2d: '',
  });

  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await getRegistrations();
      setData(result);
      if (result.length === 0) {
        setErrorMsg('Data kosong (0 rows). Periksa file sheets.ts atau Console Browser.');
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setErrorMsg(error?.message || String(error));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: Sp2dRegistration) => {
    if (item) {
      setEditingId(item.id || null);
      setFormData({
        tglAntarBerkas: item.tglAntarBerkas,
        noSpm: item.noSpm,
        namaRekanan: item.namaRekanan,
        nilaiKwitansi: item.nilaiKwitansi.toString(),
        bidang: item.bidang,
        kodeSubKegiatan: item.kodeSubKegiatan,
        pekerjaan: item.pekerjaan,
        noSp2d: item.noSp2d,
        tglCairSp2d: item.tglCairSp2d,
      });
    } else {
      setEditingId(null);
      setFormData({
        tglAntarBerkas: '',
        noSpm: '',
        namaRekanan: '',
        nilaiKwitansi: '',
        bidang: '',
        kodeSubKegiatan: '',
        pekerjaan: '',
        noSp2d: '',
        tglCairSp2d: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const payload = {
        tglAntarBerkas: formData.tglAntarBerkas,
        noSpm: formData.noSpm,
        namaRekanan: formData.namaRekanan,
        nilaiKwitansi: Number(formData.nilaiKwitansi),
        bidang: formData.bidang,
        kodeSubKegiatan: formData.kodeSubKegiatan,
        pekerjaan: formData.pekerjaan,
        noSp2d: formData.noSp2d,
        tglCairSp2d: formData.tglCairSp2d,
      };

      if (editingId) {
        await updateRegistration(editingId, payload);
      } else {
        await addRegistration(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving data", error);
      alert("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteRegistration(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting data", error);
        alert("Terjadi kesalahan saat menghapus data");
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  // Get month name from date string
  const getBulan = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Register Antar Berkas dan Pencairan</h2>
          <p className="text-gray-500 mt-1">Daftar seluruh data SP2D</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 sm:mt-0 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Data</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left" 
                 style={{ width: '100%', animationName: 'progress-bar' }}></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat data dari Spreadsheet...</p>
          <style>{`
            @keyframes progress-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Tanggal Antar Berkas</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Bulan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">No SPM</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Nilai Kwitansi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Nama Bidang</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Kode Sub Kegiatan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Pekerjaan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">No SP2D</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Tanggal Cair SP2D</th>
                  {isAdmin && <th className="px-4 py-3 text-center font-medium text-gray-500 whitespace-nowrap">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {errorMsg && (
                  <tr>
                    <td colSpan={12} className="px-4 py-4 text-center text-red-500 bg-red-50 font-medium">
                      Pesan Sistem: {errorMsg}
                    </td>
                  </tr>
                )}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{row.no}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.tglAntarBerkas}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{getBulan(row.tglAntarBerkas)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.noSpm}</td>
                      <td className="px-4 py-3">{row.namaRekanan}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.bidang}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.kodeSubKegiatan}</td>
                      <td className="px-4 py-3">{row.pekerjaan}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.noSp2d}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.tglCairSp2d}</td>
                      
                      {isAdmin && (
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenModal(row)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id!)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Input/Edit */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-gray-800/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Data SP2D' : 'Tambah Data SP2D'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <form id="sp2d-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Antar Berkas</label>
                    <input type="date" required value={formData.tglAntarBerkas} onChange={(e) => setFormData({...formData, tglAntarBerkas: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">No SPM</label>
                    <input type="text" required value={formData.noSpm} onChange={(e) => setFormData({...formData, noSpm: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="Masukkan No SPM" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Rekanan</label>
                    <input type="text" required value={formData.namaRekanan} onChange={(e) => setFormData({...formData, namaRekanan: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="Masukkan Nama Rekanan" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nilai Kwitansi (Rp)</label>
                    <input type="number" required min="0" value={formData.nilaiKwitansi} onChange={(e) => setFormData({...formData, nilaiKwitansi: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="0" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Bidang</label>
                      <select required value={formData.bidang} onChange={(e) => setFormData({...formData, bidang: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white">
                        <option value="">-- Pilih Bidang --</option>
                        {BINDANG_LIST.filter(b => b !== 'Keuangan').map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Sub Kegiatan</label>
                    <input type="text" required value={formData.kodeSubKegiatan} onChange={(e) => setFormData({...formData, kodeSubKegiatan: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="Contoh: 1.03.01..." />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">No SP2D</label>
                    <input type="text" value={formData.noSp2d} onChange={(e) => setFormData({...formData, noSp2d: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="Boleh dikosongkan sementara" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pekerjaan / Keterangan</label>
                    <textarea required rows={3} value={formData.pekerjaan} onChange={(e) => setFormData({...formData, pekerjaan: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" placeholder="Deskripsi pekerjaan..."></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Cair SP2D</label>
                    <input type="date" value={formData.tglCairSp2d} onChange={(e) => setFormData({...formData, tglCairSp2d: e.target.value})} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 sm:gap-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="sp2d-form"
                className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent px-5 py-2.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors"
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
