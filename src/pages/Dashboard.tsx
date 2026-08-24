import { useState, useCallback, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import SpreadsheetGrid, { type SpreadsheetGridRef } from '../components/SpreadsheetGrid';
import { ShieldCheck, Lock, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { type } = useParams<{ type: string }>();
  const inputType = type || 'spp';

  // We need to fetch from DataContext appropriately based on inputType, but actually DataContext provides all 3 arrays.
  const { sppData, spmData, sp2dData, mergedRekapData, loading, isKeuangan, userBidang } = useData();
  
  let currentData: any[] = [];
  if (inputType === 'spp') currentData = sppData;
  else if (inputType === 'spm') currentData = spmData;
  else if (inputType === 'sp2d') currentData = sp2dData;
  else if (inputType === 'rekap') currentData = mergedRekapData;

  const [isSyncing, setIsSyncing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const gridRef = useRef<SpreadsheetGridRef>(null);

  const canEditSpreadsheet = isKeuangan;

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
    <div className="h-full w-full flex flex-col overflow-hidden bg-white font-sans">
      {/* Integrated Header with Full Title: RABP - Register Antar Berkas dan Pencairan SP2D */}
      <header className="h-[64px] bg-[#f8f9fa] border-b border-gray-200/60 px-4 flex items-center justify-between flex-shrink-0 z-30 print:hidden transition-colors">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            <span className="font-medium text-[18px] text-[#444746] tracking-tight">
              RABP - Register Antar Berkas dan Pencairan SP2D
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300/80"></div>

          {/* User & Access Badge */}
          <div className="flex items-center space-x-2 text-[12px]">
            <span className={`inline-flex items-center space-x-1.5 font-medium px-3 py-1 rounded-full ${
              canEditSpreadsheet
                ? 'bg-[#e9eef6] text-[#0b57d0]'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {canEditSpreadsheet ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Editor Keuangan</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>{userBidang} (View-Only)</span>
                </>
              )}
            </span>
          </div>

          {isSyncing && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-[12px] font-medium bg-[#f1f3f4] text-[#444746] animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
              <span>Menyimpan...</span>
            </div>
          )}
          {!isSyncing && saveToast && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-[12px] font-medium bg-[#f1f3f4] text-[#444746] animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Tersimpan di Cloud</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {canEditSpreadsheet && (
            <button
              onClick={triggerManualSave}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-medium bg-[#0b57d0] text-white hover:bg-[#0842a0] transition-all duration-200 ripple disabled:opacity-70 shadow-sm"
            >
              <Save className="h-4 w-4" strokeWidth={2.5} />
              <span>Simpan Data</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Full-Screen Canvas Spreadsheet Area */}
      <div className="flex-1 w-full h-[calc(100%-64px)] relative overflow-hidden flex flex-col print:hidden bg-white">
        {loading && currentData.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 flex-1 bg-white">
            <div className="w-64 h-1 bg-[#f1f3f4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0b57d0] rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"
                style={{ width: '100%', animationName: 'progress-bar' }}
              ></div>
            </div>
            <p className="text-sm font-medium text-[#444746] animate-pulse">Memuat spreadsheet dari Cloud...</p>
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
            key={inputType}
            ref={gridRef}
            data={currentData}
            inputType={inputType as 'spp' | 'spm' | 'sp2d' | 'rekap'}
            userBidang={userBidang}
            isKeuangan={isKeuangan}
            onSyncStateChange={handleSyncStateChange}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </div>
    </div>
  );
}
