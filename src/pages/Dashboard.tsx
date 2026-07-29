import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import SpreadsheetGrid, { type SpreadsheetGridRef } from '../components/SpreadsheetGrid';
import SearchSp2d from './SearchSp2d';
import Recap from './Recap';
import { Lock, ShieldCheck, Search, FileText, LogOut, X, RefreshCw, Save, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data, loading, isKeuangan, userBidang } = useData();

  const [activeOverlay, setActiveOverlay] = useState<'search' | 'recap' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const gridRef = useRef<SpreadsheetGridRef>(null);

  const isAdmin = useAuth().user?.role === 'admin' || isKeuangan;
  const canEditSpreadsheet = isAdmin || isKeuangan;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSyncStateChange = useCallback((syncing: boolean) => {
    setIsSyncing(syncing);
  }, []);

  const handleSaveSuccess = useCallback(() => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }, []);

  const triggerManualSave = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.saveData();
    }
  }, []);

  // Global Keyboard Shortcut for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); // Prevent browser save popup
        triggerManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerManualSave]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 font-sans">
      {/* Integrated Header with Full Title: RABP - Register Antar Berkas dan Pencairan SP2D */}
      <header className="h-[44px] bg-white border-b border-gray-300 px-3 flex items-center justify-between flex-shrink-0 z-30 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-[#0f9d58] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              📊
            </div>
            <span className="font-bold text-xs text-gray-800 tracking-tight">
              RABP - Register Antar Berkas dan Pencairan SP2D
            </span>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          {/* User & Access Badge */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className={`inline-flex items-center space-x-1 font-semibold px-2 py-0.5 rounded ${
              canEditSpreadsheet
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}>
              {canEditSpreadsheet ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Editor Keuangan</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-amber-600" />
                  <span>{userBidang} (View-Only)</span>
                </>
              )}
            </span>
          </div>

          {/* Header Firebase Sync / Save Success Toast Badge */}
          {isSyncing && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#0f9d58] border border-emerald-300 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin text-[#0f9d58]" />
              <span>Menyimpan ke Firebase...</span>
            </div>
          )}

          {saveToast && !isSyncing && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400 animate-in fade-in duration-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Data Berhasil Disimpan!</span>
            </div>
          )}
        </div>

        {/* Spreadsheet Integrated Tools */}
        <div className="flex items-center space-x-2">
          {/* Manual Save Button (Ctrl + S / Cmd + S) */}
          {canEditSpreadsheet && (
            <button
              onClick={triggerManualSave}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#0f9d58] hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
              title="Simpan perubahan ke Firebase (Shortcut: Ctrl + S / Cmd + S)"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Simpan Data</span>
              <span className="ml-1 text-[10px] font-mono opacity-80 bg-emerald-800/40 px-1 rounded">
                Ctrl+S
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveOverlay('search')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
              activeOverlay === 'search'
                ? 'bg-[#0f9d58] text-white border-[#0f9d58] shadow-xs'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Pencarian</span>
          </button>

          <button
            onClick={() => setActiveOverlay('recap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
              activeOverlay === 'recap'
                ? 'bg-[#0f9d58] text-white border-[#0f9d58] shadow-xs'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Rekapitulasi (PDF/Excel)</span>
          </button>

          <div className="h-4 w-px bg-gray-300"></div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
            title="Logout Akun"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Canvas Spreadsheet Area */}
      <div className="flex-1 w-full h-[calc(100vh-44px)] relative overflow-hidden flex flex-col print:hidden">
        {loading && data.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 flex-1 bg-white">
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0f9d58] rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"
                style={{ width: '100%', animationName: 'progress-bar' }}
              ></div>
            </div>
            <p className="text-xs font-semibold text-gray-500 animate-pulse">Memuat spreadsheet dari Firebase Firestore...</p>
            <style>{`
              @keyframes progress-bar {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0); }
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        ) : (
          <SpreadsheetGrid
            ref={gridRef}
            data={data}
            isAdmin={isAdmin}
            userBidang={userBidang}
            isKeuangan={isKeuangan}
            onSyncStateChange={handleSyncStateChange}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </div>

      {/* Slide-over Overlay for Search / Recap Tools */}
      {activeOverlay && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150 print:bg-transparent print:backdrop-blur-none">
          <div
            className="fixed inset-0 print:hidden"
            onClick={() => setActiveOverlay(null)}
          ></div>
          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-gray-300 print:max-w-none print:border-none print:shadow-none">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0 print:hidden">
              <div className="flex items-center space-x-2">
                {activeOverlay === 'search' ? (
                  <>
                    <Search className="h-5 w-5 text-[#0f9d58]" />
                    <h3 className="text-lg font-bold text-gray-900">Alat Pencarian Data SP2D</h3>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 text-[#0f9d58]" />
                    <h3 className="text-lg font-bold text-gray-900">Alat Rekapitulasi Data (PDF / Excel)</h3>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveOverlay(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar print:overflow-visible print:p-0">
              {activeOverlay === 'search' ? <SearchSp2d /> : <Recap />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
