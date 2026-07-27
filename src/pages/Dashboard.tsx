import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Sp2dRegistration } from '../types';
import { getRegistrations, addRegistration, updateRegistration, deleteRegistration } from '../lib/db';
import { USERS } from '../lib/users';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  // Admin is Keuangan, others are viewers. Viewers only see fields related to their Bidang if we want, but instruction says "mencari data dan mengecek data saja". Meaning they can see all.

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
        <div className="text-center py-10">Memuat data...</div>
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
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                    {editingId ? 'Edit Data SP2D' : 'Tambah Data SP2D'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form id="sp2d-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tanggal Antar Berkas</label>
                      <input type="date" required value={formData.tglAntarBerkas} onChange={(e) => setFormData({...formData, tglAntarBerkas: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">No SPM</label>
                      <input type="text" required value={formData.noSpm} onChange={(e) => setFormData({...formData, noSpm: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Nama Rekanan</label>
                      <input type="text" required value={formData.namaRekanan} onChange={(e) => setFormData({...formData, namaRekanan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nilai Kwitansi (Rp)</label>
                      <input type="number" required min="0" value={formData.nilaiKwitansi} onChange={(e) => setFormData({...formData, nilaiKwitansi: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nama Bidang</label>
                      <select required value={formData.bidang} onChange={(e) => setFormData({...formData, bidang: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white">
                        <option value="">-- Pilih Bidang --</option>
                        {USERS.filter(u => u.bidang !== 'Keuangan').map(u => (
                          <option key={u.bidang} value={u.bidang}>{u.bidang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kode Sub Kegiatan</label>
                      <input type="text" required value={formData.kodeSubKegiatan} onChange={(e) => setFormData({...formData, kodeSubKegiatan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">No SP2D</label>
                      <input type="text" value={formData.noSp2d} onChange={(e) => setFormData({...formData, noSp2d: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Pekerjaan / Keterangan</label>
                      <textarea required rows={2} value={formData.pekerjaan} onChange={(e) => setFormData({...formData, pekerjaan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tanggal Cair SP2D</label>
                      <input type="date" value={formData.tglCairSp2d} onChange={(e) => setFormData({...formData, tglCairSp2d: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  form="sp2d-form"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
