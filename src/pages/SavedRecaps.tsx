import { useState, useEffect } from 'react';
import { updateSavedAntarBerkas, deleteSavedAntarBerkas, subscribeToCollection, type SavedAntarBerkasRecord } from '../lib/firestoreService';
import { formatIndoFullDate, parseFlexDate } from '../lib/dateUtils';
import { Download, FileDown, Trash2, Calendar, BookmarkCheck, Eye, X, RefreshCw, Edit3, Save, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SavedRecaps() {
  const [records, setRecords] = useState<SavedAntarBerkasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SavedAntarBerkasRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<SavedAntarBerkasRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCollection<SavedAntarBerkasRecord>(
      'saved_rekap_antar_berkas',
      (data) => {
        // Sort newest first
        const sorted = [...data].sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setRecords(sorted);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching saved recaps:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter records by date or search input
  const filteredRecords = records.filter((rec) => {
    if (!searchDate.trim()) return true;
    const q = searchDate.trim().toLowerCase();

    const parsedQ = parseFlexDate(q);
    const recAntarParsed = parseFlexDate(rec.tanggalAntar);

    if (parsedQ && recAntarParsed && recAntarParsed === parsedQ) {
      return true;
    }

    const tglText = (rec.tanggalAntar || '').toLowerCase();
    const tglFullText = (rec.tanggalAntarFull || formatIndoFullDate(rec.tanggalAntar)).toLowerCase();
    const bidangText = (rec.bidang || '').toLowerCase();

    return tglText.includes(q) || tglFullText.includes(q) || bidangText.includes(q);
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus data rekapitulasi tersimpan ini?')) return;
    try {
      setDeletingId(id);
      await deleteSavedAntarBerkas(id);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
      if (editingRecord?.id === id) {
        setEditingRecord(null);
      }
    } catch (err) {
      alert('Gagal menghapus data.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord || !editingRecord.id) return;
    try {
      setIsUpdating(true);
      const totalNilai = editingRecord.items.reduce((sum, item) => sum + (Number(item.nilaiBruto) || 0), 0);
      const formattedTgl = formatIndoFullDate(editingRecord.tanggalAntar);

      const updatePayload = {
        tanggalAntar: editingRecord.tanggalAntar,
        tanggalAntarFull: formattedTgl,
        bidang: editingRecord.bidang,
        jumlahData: editingRecord.items.length,
        totalNilai: totalNilai,
        items: editingRecord.items,
      };

      await updateSavedAntarBerkas(editingRecord.id, updatePayload);
      alert('Data rekapitulasi berhasil diperbarui!');
      setEditingRecord(null);
    } catch (err) {
      alert('Gagal mengupdate data rekapitulasi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportExcel = (rec: SavedAntarBerkasRecord) => {
    if (!rec.items || rec.items.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    const exportData = rec.items.map((item, index) => ({
      'No.': index + 1,
      'Tanggal SPM': item.tanggalSpm || '',
      'No. SPM': item.nomorSpm || '',
      'Nama Rekanan': item.namaPenerima || '',
      'Nilai Kwitansi (Rp)': item.nilaiBruto || 0,
      'Keterangan': item.keterangan || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 22 }, { wch: 45 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Antar Berkas');

    const cleanTgl = (rec.tanggalAntar || 'Rekap').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Rekap_Antar_Berkas_${cleanTgl}.xlsx`);
  };

  const handlePrintRecord = (rec: SavedAntarBerkasRecord) => {
    setSelectedRecord(rec);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    if (!editingRecord) return;
    const updatedItems = [...editingRecord.items];
    updatedItems[idx] = {
      ...updatedItems[idx],
      [field]: field === 'nilaiBruto' ? Number(value) || 0 : value
    };
    setEditingRecord({
      ...editingRecord,
      items: updatedItems
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (!editingRecord) return;
    const updatedItems = editingRecord.items.filter((_, i) => i !== idx);
    setEditingRecord({
      ...editingRecord,
      items: updatedItems
    });
  };

  const handleAddItem = () => {
    if (!editingRecord) return;
    setEditingRecord({
      ...editingRecord,
      items: [
        ...editingRecord.items,
        { tanggalSpm: '', nomorSpm: '', namaPenerima: '', nilaiBruto: 0, keterangan: '' }
      ]
    });
  };

  return (
    <div className="space-y-6 font-sans print-container p-6 bg-[#f8f9fa] min-h-full overflow-y-auto custom-scrollbar print:bg-white print:p-0 print:block">
      {/* Header section */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-6 no-print print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-[#e9eef6] flex items-center justify-center text-[#0b57d0]">
              <BookmarkCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[22px] font-normal text-[#1f1f1f] leading-tight">
                Riwayat Rekap Antar Berkas
              </h3>
              <p className="text-[14px] text-[#444746] mt-0.5">Daftar Laporan Antar Berkas yang Telah Disimpan</p>
            </div>
          </div>
        </div>

        {/* Filter Date Picker */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <label className="block text-[12px] font-medium text-[#444746] mb-1">Cari Berdasarkan Tanggal</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:bg-white transition-all"
              />
            </div>
            {searchDate && (
              <button
                onClick={() => setSearchDate('')}
                className="mt-5 text-xs text-[#0b57d0] hover:underline font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="text-xs text-[#444746] font-medium self-end sm:self-center">
            Total Laporan Tersimpan: <strong className="text-[#0b57d0]">{filteredRecords.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm no-print print:hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0b57d0]" />
            <span>Memuat riwayat rekapitulasi...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-base text-gray-700">Tidak ada riwayat rekap yang cocok</p>
            <p className="text-xs text-gray-400 mt-1">Coba filter tanggal lain atau simpan rekap baru dari menu Rekapitulasi.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((rec) => {
              const displayDate = formatIndoFullDate(rec.tanggalAntar || rec.tanggalSimpan);
              return (
                <div
                  key={rec.id}
                  className="p-5 hover:bg-[#f8f9fa] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-[#1f1f1f]">
                        Tanggal Antar: {displayDate}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#444746]">
                      <span>Bidang: <strong className="text-gray-800">{rec.bidang || 'Semua'}</strong></span>
                      <span>•</span>
                      <span>Total Berkas: <strong className="text-gray-800">{rec.jumlahData} Berkas</strong></span>
                      <span>•</span>
                      <span>Nilai Total: <strong className="text-[#0b57d0]">{formatCurrency(rec.totalNilai)}</strong></span>
                      <span>•</span>
                      <span className="text-gray-400">Disimpan: {rec.tanggalSimpan}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="flex items-center space-x-1.5 bg-[#e9eef6] text-[#0b57d0] hover:bg-[#d3e3fd] px-3.5 py-2 rounded-full text-xs font-medium transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Lihat</span>
                    </button>

                    <button
                      onClick={() => setEditingRecord({ ...rec, items: JSON.parse(JSON.stringify(rec.items || [])) })}
                      className="flex items-center space-x-1.5 bg-[#e9eef6] text-[#0b57d0] hover:bg-[#d3e3fd] px-3.5 py-2 rounded-full text-xs font-medium transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handlePrintRecord(rec)}
                      className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-full text-xs font-medium transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Cetak</span>
                    </button>

                    <button
                      onClick={() => handleExportExcel(rec)}
                      className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-full text-xs font-medium transition-all"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      onClick={(e) => handleDelete(rec.id!, e)}
                      disabled={deletingId === rec.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-[#0b57d0]" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Edit Data Rekap Antar Berkas
                </h4>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Antar Berkas</label>
                  <input
                    type="date"
                    value={editingRecord.tanggalAntar || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, tanggalAntar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0b57d0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bidang</label>
                  <input
                    type="text"
                    value={editingRecord.bidang || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, bidang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0b57d0] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-900">Daftar Berkas ({editingRecord.items?.length || 0})</h5>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 text-xs font-medium text-[#0b57d0] hover:bg-[#e9eef6] px-3 py-1.5 rounded-full transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editingRecord.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 relative space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Item #{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-full text-xs font-medium"
                          title="Hapus Baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Tanggal SPM</label>
                          <input
                            type="text"
                            value={item.tanggalSpm || ''}
                            onChange={(e) => handleItemChange(idx, 'tanggalSpm', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">No. SPM</label>
                          <input
                            type="text"
                            value={item.nomorSpm || ''}
                            onChange={(e) => handleItemChange(idx, 'nomorSpm', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Nama Rekanan</label>
                          <input
                            type="text"
                            value={item.namaPenerima || ''}
                            onChange={(e) => handleItemChange(idx, 'namaPenerima', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Nilai Kwitansi (Rp)</label>
                          <input
                            type="number"
                            value={item.nilaiBruto || 0}
                            onChange={(e) => handleItemChange(idx, 'nilaiBruto', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Keterangan</label>
                          <input
                            type="text"
                            value={item.keterangan || ''}
                            onChange={(e) => handleItemChange(idx, 'keterangan', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-full transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateRecord}
                disabled={isUpdating}
                className="flex items-center space-x-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2 rounded-full text-xs font-medium transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Detail Modal View */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:static print:bg-white print:backdrop-none">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-h-none print:w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between no-print print:hidden">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Detail Rekap Antar Berkas
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tanggal Antar: <strong>{formatIndoFullDate(selectedRecord.tanggalAntar)}</strong>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePrintRecord(selectedRecord)}
                  className="flex items-center space-x-1.5 bg-[#0b57d0] text-white hover:bg-[#0842a0] px-4 py-2 rounded-full text-xs font-medium transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable View Header */}
            <div className="hidden print:block print-header mb-6 text-center border-b pb-4 pt-4">
              <h1 className="text-xl font-bold text-black uppercase">
                Laporan Rekapitulasi Antar Berkas
              </h1>
              <p className="text-sm text-gray-800 mt-1 font-medium">
                Tanggal Antar: {formatIndoFullDate(selectedRecord.tanggalAntar)}
              </p>
            </div>

            {/* Modal Body / Table */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 print:p-0 print:overflow-visible">
              <table className="min-w-full text-left border-collapse print:border print:border-black">
                <thead className="bg-gray-50 text-[12px] font-semibold text-[#444746] border-b border-gray-200 print:bg-white print:border-b-black print:text-black">
                  <tr>
                    <th className="px-4 py-3 font-medium text-center w-12">No</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Tgl SPM</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">No SPM</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Nama Rekanan</th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Nilai Kwitansi (Bruto)</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-black/50">
                  {selectedRecord.items.map((row: any, idx: number) => (
                    <tr key={idx} className="print:break-inside-avoid">
                      <td className="px-4 py-3 text-center text-xs text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{row.tanggalSpm || '-'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#0b57d0] print:text-black whitespace-nowrap">{row.nomorSpm || '-'}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">{row.namaPenerima || '-'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-right text-gray-800 print:text-black whitespace-nowrap">{formatCurrency(row.nilaiBruto)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 print:whitespace-normal">{row.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 print:bg-white">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-xs font-medium text-gray-700">Total Kwitansi:</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-gray-900 print:text-black">{formatCurrency(selectedRecord.totalNilai)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

