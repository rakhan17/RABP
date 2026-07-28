import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { deleteRegistrationFromFirestore } from '../lib/firestoreService';
import SpreadsheetGrid from '../components/SpreadsheetGrid';
import { Plus, Edit2, Trash2, X, RefreshCw, Eye, Grid, Table as TableIcon, Database } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, errorMsg, refreshData, seedInitialData, isKeuangan, userBidang } = useData();

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isSeeding, setIsSeeding] = useState(false);

  // Custom right-click Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: Sp2dRegistration;
  } | null>(null);

  const isAdmin = user?.role === 'admin';

  // Close context menu on global click (outside)
  useEffect(() => {
    const handleCloseMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.context-menu')) return;
      setContextMenu(null);
    };

    window.addEventListener('click', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRowId(null);
        setContextMenu(null);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (selectedRowId) {
          e.preventDefault();
          const currentIndex = data.findIndex((d) => d.id === selectedRowId);
          if (e.key === 'ArrowDown' && currentIndex < data.length - 1) {
            setSelectedRowId(data[currentIndex + 1].id!);
          } else if (e.key === 'ArrowUp' && currentIndex > 0) {
            setSelectedRowId(data[currentIndex - 1].id!);
          }
        } else if (data.length > 0) {
          setSelectedRowId(data[0].id!);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowId, data]);

  // Scroll to selected row
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedRowId]);

  const handleContextMenu = (e: React.MouseEvent, row: Sp2dRegistration) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRowId(row.id || null);

    let x = e.clientX;
    let y = e.clientY;

    if (x + 180 > window.innerWidth) x = window.innerWidth - 180;
    if (y + 150 > window.innerHeight) y = Math.max(10, e.clientY - 140);

    setContextMenu({ x, y, row });
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!isAdmin && !isKeuangan) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini dari Firebase?')) {
      setIsDeleting(true);
      try {
        await deleteRegistrationFromFirestore(id);
        if (selectedRowId === id) setSelectedRowId(null);
        setContextMenu(null);
      } catch (error: any) {
        console.error('Error deleting data from Firebase', error);
        alert(error?.message || 'Terjadi kesalahan saat menghapus data dari Firebase');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleManualSeed = async () => {
    if (!window.confirm("Impordata dari Google Sheets ke Firebase Firestore?")) return;
    setIsSeeding(true);
    try {
      const count = await seedInitialData();
      alert(`Berhasil mengimpor ${count} data ke Firebase Firestore!`);
    } catch (err: any) {
      alert(`Gagal impor data: ${err?.message || err}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  const getBulan = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
  };

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<Sp2dRegistration | null>(null);

  const handleOpenDetail = (item: Sp2dRegistration) => {
    setDetailData(item);
    setIsDetailOpen(true);
    setContextMenu(null);
  };

  return (
    <div className="space-y-6 h-full flex flex-col print-container">
      {isDeleting && (
        <div className="fixed inset-0 z-[1000] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center space-x-4">
            <RefreshCw className="h-6 w-6 text-red-600 animate-spin" />
            <div>
              <h4 className="font-bold text-gray-800">Menghapus Data...</h4>
              <p className="text-xs text-gray-500">Mohon tunggu sebentar, sedang memperbarui Firebase Firestore.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 no-print gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Register Antar Berkas dan Pencairan</h2>
          <p className="text-gray-500 mt-1 flex items-center space-x-2">
            <span>Daftar data SP2D</span>
            <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full text-xs">
              {isKeuangan ? 'Akses Keuangan (Semua Bidang)' : `Bidang: ${userBidang}`}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-gray-200 p-1 rounded-lg flex items-center space-x-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Spreadsheet</span>
            </button>
          </div>

          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm transition-colors text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isKeuangan && (
            <button
              onClick={handleManualSeed}
              disabled={isSeeding}
              className="flex items-center justify-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              title="Import data dari Google Sheets ke Firebase Firestore"
            >
              <Database className="h-4 w-4" />
              <span>{isSeeding ? 'Mengimpor...' : 'Sync Firestore'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate('/add')}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Data</span>
            </button>
          )}
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 flex-1">
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"
              style={{ width: '100%', animationName: 'progress-bar' }}
            ></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Memuat data dari Firebase Firestore...</p>
          <style>{`
            @keyframes progress-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      ) : viewMode === 'grid' ? (
        /* Built-in Interactive Spreadsheet Data Grid */
        <SpreadsheetGrid
          data={data}
          isAdmin={isAdmin}
          userBidang={userBidang}
          isKeuangan={isKeuangan}
        />
      ) : (
        /* Standard Table View */
        <div className="bg-white shadow-sm border border-gray-300 overflow-hidden flex-1 flex flex-col relative print-fullscreen">
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
              <tbody className="divide-y divide-gray-200 bg-white relative">
                {errorMsg && (
                  <tr>
                    <td colSpan={11} className="px-4 py-4 text-center text-red-500 bg-red-50 font-medium border border-gray-300">
                      Pesan Sistem: {errorMsg}
                    </td>
                  </tr>
                )}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500 border border-gray-300">
                      Belum ada data untuk {isKeuangan ? 'semua bidang' : `bidang ${userBidang}`}.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => {
                    const isSelected = selectedRowId === row.id;
                    return (
                      <tr
                        key={row.id}
                        ref={isSelected ? selectedRowRef : null}
                        onClick={() => setSelectedRowId(row.id!)}
                        onContextMenu={(e) => handleContextMenu(e, row)}
                        className={`group transition-colors divide-x divide-gray-200 cursor-pointer ${
                          isSelected ? 'bg-blue-50/90 ring-2 ring-blue-500 ring-inset z-10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className={`px-2 py-1.5 whitespace-nowrap text-center text-gray-500 ${isSelected ? 'bg-blue-50/90 font-bold' : 'bg-gray-50'}`}>{row.no}</td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="context-menu fixed z-[999] bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/80 py-1 min-w-[170px] text-xs font-medium text-gray-700 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleOpenDetail(contextMenu.row)}
            className="w-full text-left px-3 py-2 hover:bg-blue-600 hover:text-white flex items-center space-x-2 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Lihat Detail</span>
          </button>

          {(isAdmin || isKeuangan) && (
            <>
              <button
                onClick={() => {
                  setContextMenu(null);
                  navigate(`/edit/${contextMenu.row.id}`);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-600 hover:text-white flex items-center space-x-2 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Data</span>
              </button>
              <div className="my-1 border-t border-gray-100"></div>
              <button
                onClick={() => handleDelete(contextMenu.row.id!)}
                className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white text-red-600 flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Data</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal Detail */}
      {isDetailOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-800/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col z-10">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Detail Data SP2D</h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] overflow-x-hidden">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 text-sm break-words">
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Antar Berkas</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{detailData.tglAntarBerkas || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">No SPM</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-all">{detailData.noSpm || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Rekanan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-words">{detailData.namaRekanan || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Kwitansi</dt>
                  <dd className="mt-1 font-semibold text-blue-600 text-base">{formatCurrency(detailData.nilaiKwitansi)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bidang</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{detailData.bidang || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Sub Kegiatan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-all">{detailData.kodeSubKegiatan || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Cair SP2D</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{detailData.tglCairSp2d || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">No SP2D</dt>
                  <dd className="mt-1 font-semibold text-green-600 break-all bg-green-50/50 p-2.5 rounded-lg border border-green-100">{detailData.noSp2d || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pekerjaan / Keterangan</dt>
                  <dd className="mt-1 font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 break-words">{detailData.pekerjaan || '-'}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
              {(isAdmin || isKeuangan) && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    navigate(`/edit/${detailData.id}`);
                  }}
                  className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-green-600" />
                  <span>Edit Data</span>
                </button>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
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
