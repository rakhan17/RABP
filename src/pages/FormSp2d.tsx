import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { addRegistrationToFirestore, updateRegistrationInFirestore } from '../lib/firestoreService';
import { BINDANG_LIST } from '../lib/users';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function FormSp2d() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isKeuangan, userBidang } = useData();

  const isEditing = Boolean(id);
  const isAdmin = user?.role === 'admin' || isKeuangan;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tglAntarBerkas: '',
    noSpm: '',
    namaRekanan: '',
    nilaiKwitansi: '',
    bidang: userBidang || '',
    kodeSubKegiatan: '',
    pekerjaan: '',
    noSp2d: '',
    tglCairSp2d: '',
  });

  const parseToInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const months: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
    };

    const parts = str.split(/\s+/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1].toLowerCase()];
      const year = parts[2];
      if (month && year && day) return `${year}-${month}-${day}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  useEffect(() => {
    if (isEditing && id) {
      const existing = data.find((item) => item.id === id);
      if (existing) {
        setFormData({
          tglAntarBerkas: parseToInputDate(existing.tglAntarBerkas),
          noSpm: existing.noSpm || '',
          namaRekanan: existing.namaRekanan || '',
          nilaiKwitansi: existing.nilaiKwitansi ? existing.nilaiKwitansi.toString() : '',
          bidang: existing.bidang || userBidang || '',
          kodeSubKegiatan: existing.kodeSubKegiatan || '',
          pekerjaan: existing.pekerjaan || '',
          noSp2d: existing.noSp2d || '',
          tglCairSp2d: parseToInputDate(existing.tglCairSp2d),
        });
      }
    } else {
      if (!isKeuangan && userBidang) {
        setFormData((prev) => ({ ...prev, bidang: userBidang }));
      }
    }
  }, [isEditing, id, data, userBidang, isKeuangan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Anda tidak memiliki akses untuk menyimpan data.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tglAntarBerkas: formData.tglAntarBerkas,
        noSpm: formData.noSpm,
        namaRekanan: formData.namaRekanan,
        nilaiKwitansi: formData.nilaiKwitansi ? Number(formData.nilaiKwitansi) : 0,
        bidang: isKeuangan ? formData.bidang : (userBidang || formData.bidang),
        kodeSubKegiatan: formData.kodeSubKegiatan,
        pekerjaan: formData.pekerjaan,
        noSp2d: formData.noSp2d,
        tglCairSp2d: formData.tglCairSp2d,
      };

      if (isEditing && id) {
        await updateRegistrationInFirestore(id, payload);
      } else {
        await addRegistrationToFirestore(payload);
      }
      navigate('/');
    } catch (error: any) {
      console.error("Error saving data to Firestore:", error);
      alert(error?.message || "Terjadi kesalahan saat menyimpan data ke Firebase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Data SP2D' : 'Tambah Data SP2D Baru'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tersimpan langsung ke Firebase Firestore. Semua bidang isian bersifat opsional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Antar Berkas
              </label>
              <input
                type="date"
                value={formData.tglAntarBerkas}
                onChange={(e) => setFormData({ ...formData, tglAntarBerkas: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                No SPM
              </label>
              <input
                type="text"
                value={formData.noSpm}
                onChange={(e) => setFormData({ ...formData, noSpm: e.target.value })}
                placeholder="Contoh: 00123/SPM/2026"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Rekanan
              </label>
              <input
                type="text"
                value={formData.namaRekanan}
                onChange={(e) => setFormData({ ...formData, namaRekanan: e.target.value })}
                placeholder="Nama Perusahaan / Rekanan"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nilai Kwitansi (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.nilaiKwitansi}
                onChange={(e) => setFormData({ ...formData, nilaiKwitansi: e.target.value })}
                placeholder="0"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Bidang
              </label>
              <select
                value={formData.bidang}
                onChange={(e) => setFormData({ ...formData, bidang: e.target.value })}
                disabled={!isKeuangan}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white disabled:bg-gray-100 disabled:text-gray-600"
              >
                <option value="">-- Pilih Bidang --</option>
                {BINDANG_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Kode Sub Kegiatan
              </label>
              <input
                type="text"
                value={formData.kodeSubKegiatan}
                onChange={(e) => setFormData({ ...formData, kodeSubKegiatan: e.target.value })}
                placeholder="Kode Sub Kegiatan"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                No SP2D
              </label>
              <input
                type="text"
                value={formData.noSp2d}
                onChange={(e) => setFormData({ ...formData, noSp2d: e.target.value })}
                placeholder="Nomor SP2D"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Cair SP2D
              </label>
              <input
                type="date"
                value={formData.tglCairSp2d}
                onChange={(e) => setFormData({ ...formData, tglCairSp2d: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Keterangan Pekerjaan
              </label>
              <textarea
                rows={4}
                value={formData.pekerjaan}
                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                placeholder="Deskripsi uraian pekerjaan..."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !isAdmin}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan ke Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
