import { useMemo, useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import type { Sp2dRegistration } from '../types';
import { addRegistrationToFirestore, updateRegistrationInFirestore } from '../lib/firestoreService';

export interface SpreadsheetGridRef {
  saveData: () => Promise<void>;
}

interface SpreadsheetGridProps {
  data: Sp2dRegistration[];
  isAdmin: boolean;
  userBidang: string;
  isKeuangan: boolean;
  onSyncStateChange?: (syncing: boolean) => void;
  onSaveSuccess?: () => void;
}

// 10 Columns in exact requested order:
const COLUMN_TITLES = [
  'Tanggal Antar Berkas',
  'Bulan',
  'No SPM',
  'Nama Rekanan',
  'Nilai Kwitansi',
  'Nama Bidang',
  'Kode Sub Kegiatan',
  'Keterangan',
  'No SP2D',
  'Tanggal Cair SP2D',
];

const COLUMN_WIDTHS: Record<number, number> = {
  0: 160, // Tanggal Antar Berkas
  1: 120, // Bulan
  2: 170, // No SPM
  3: 240, // Nama Rekanan
  4: 170, // Nilai Kwitansi
  5: 170, // Nama Bidang
  6: 150, // Kode Sub Kegiatan
  7: 340, // Keterangan (Pekerjaan)
  8: 200, // No SP2D
  9: 160, // Tanggal Cair SP2D
};

// Indonesian Month Helper
function getIndonesianMonth(dateStr: string): string {
  if (!dateStr) return '';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  for (const m of months) {
    if (dateStr.toLowerCase().includes(m.toLowerCase())) return m;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return months[d.getMonth()];
  }

  const parts = dateStr.split(/[-/\s]/);
  if (parts.length >= 2) {
    let mNum = parseInt(parts[1], 10);
    if (isNaN(mNum)) mNum = parseInt(parts[0], 10);
    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      return months[mNum - 1];
    }
  }

  return '';
}

const SpreadsheetGrid = forwardRef<SpreadsheetGridRef, SpreadsheetGridProps>(({
  data,
  isAdmin,
  userBidang,
  isKeuangan,
  onSyncStateChange,
  onSaveSuccess,
}, ref) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const canEditSpreadsheet = isAdmin || isKeuangan;
  const currentSheetDataRef = useRef<any[]>([]);

  const workbookRef = useRef<WorkbookInstance>(null);

  // Notify parent of sync state for header badge display
  useEffect(() => {
    onSyncStateChange?.(isSyncing);
  }, [isSyncing, onSyncStateChange]);

  // Transform dataset into FortuneSheet celldata format
  const { celldata, rowHeights } = useMemo(() => {
    const cells: any[] = [];
    const heights: Record<number, number> = {};

    // 1. INJECT GREEN HEADER INTO ROW 0 (So it scrolls and resizes nicely with columns)
    heights[0] = 36; // Header height
    COLUMN_TITLES.forEach((title, cIdx) => {
      cells.push({
        r: 0,
        c: cIdx,
        v: {
          v: title,
          m: title,
          bg: '#0f9d58', // Green background
          fc: '#ffffff', // White text
          bl: 1,         // Bold
          vt: 1,         // Vertical center alignment
          ht: 1,         // Horizontal center alignment
          ct: { fa: '@', t: 's' } // String format
        },
      });
    });

    // 2. INJECT USER DATA STARTING AT ROW 1
    data.forEach((row, rIdx) => {
      const r = rIdx + 1; // User Data starts at Grid Row 1
      const tglAntar = row.tglAntarBerkas || '';
      const bulanCalc = getIndonesianMonth(tglAntar);

      const rowValues = [
        tglAntar,               // Col 0
        bulanCalc,              // Col 1
        row.noSpm || '',        // Col 2
        row.namaRekanan || '',  // Col 3
        row.nilaiKwitansi || 0, // Col 4
        row.bidang || '',       // Col 5
        row.kodeSubKegiatan || '', // Col 6
        row.pekerjaan || '',    // Col 7
        row.noSp2d || '',       // Col 8
        row.tglCairSp2d || '',  // Col 9
      ];

      // Auto row height minimum 36px
      const maxTextLen = Math.max(
        String(row.pekerjaan || '').length,
        String(row.namaRekanan || '').length
      );
      heights[r] = maxTextLen > 35 ? Math.min(140, Math.max(38, Math.ceil(maxTextLen / 28) * 24)) : 36;

      rowValues.forEach((val, cIdx) => {
        const isKwitan = cIdx === 4; // Col 4 is Nilai Kwitansi
        const strVal = val !== undefined && val !== null ? String(val) : '';

        cells.push({
          r,
          c: cIdx,
          v: {
            v: isKwitan ? (Number(val) || 0) : strVal,
            m: isKwitan
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)
              : strVal,
            vt: 1,
            ht: isKwitan ? 2 : 1, // Right-align nominal, center others
            ct: { fa: '@', t: 's' },
          },
        });
      });
    });

    // 3. PRE-FILL EMPTY ROWS WITH TEXT FORMAT TO PREVENT LEADING ZERO STRIPPING
    // FortuneSheet strips leading zeros on paste if the destination cell doesn't have an explicit text format.
    const maxEmptyRows = Math.max(100, data.length + 30);
    for (let r = data.length + 1; r < maxEmptyRows; r++) {
      for (let c = 0; c < 10; c++) {
        const isKwitan = c === 4;
        cells.push({
          r,
          c,
          v: {
            v: '',
            m: '',
            vt: 1,
            ht: isKwitan ? 2 : 1, // Right-align nominal, center others
            ct: isKwitan ? undefined : { fa: '@', t: 's' },
          },
        });
      }
    }

    return { celldata: cells, rowHeights: heights };
  }, [data]);

  // FortuneSheet Workbook data state locked to 10 columns
  const sheets = useMemo(
    () => [
      {
        name: isKeuangan ? 'Semua Bidang' : userBidang || 'Register SP2D',
        color: '#0f9d58', // Google Sheets Green Tab
        status: 1,
        order: 0,
        row: Math.max(100, data.length + 30),
        column: 10, // Exactly 10 columns
        frozen: { type: 'row' as const }, // Freezes Row 0 (Our Green Custom Header)
        config: {
          rowlen: rowHeights,
          columnlen: COLUMN_WIDTHS,
        },
        celldata,
      },
    ],
    [data, celldata, rowHeights, isKeuangan, userBidang]
  );

  // Core Save to Firestore function
  const syncToFirestore = useCallback(async () => {
    if (!isAdmin && !isKeuangan) return;
    
    // Always get the MOST RECENT synchronous data directly from the FortuneSheet instance
    // rather than waiting for the potentially debounced `onChange` event to fire,
    // which can be buggy during large pastes.
    const instanceData = workbookRef.current?.getAllSheets()?.[0]?.data;
    const gridData = instanceData || currentSheetDataRef.current;
    
    if (!gridData || gridData.length === 0) return;

    setIsSyncing(true);
    try {
      // Iterate grid rows STARTING FROM ROW 1 (Ignore Row 0, which is our custom Header)
      let savedCount = 0;
      console.log("Saving to Firestore. Total grid rows:", gridData.length);
      for (let r = 1; r < gridData.length; r++) {
        const rowCells = gridData[r];
        if (!rowCells) continue;

        // PRESERVE LEADING ZEROS
        const getCellStringVal = (c: number): string => {
          const cell = rowCells[c];
          if (!cell) return '';
          if (cell.m !== undefined && cell.m !== null && String(cell.m).trim() !== '') return String(cell.m).trim();
          if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
          return '';
        };

        const tglAntarBerkas = getCellStringVal(0);
        let noSpm = getCellStringVal(2);
        
        // AUTO-PAD PURELY NUMERIC NO SPM TO 4 DIGITS
        // This handles cases where pasting from Excel strips leading zeros (e.g. 0001 becomes 1).
        if (/^\d+$/.test(noSpm) && noSpm.length < 4) {
          noSpm = noSpm.padStart(4, '0');
          // VISUALLY FIX IT ON THE SCREEN IMMEDIATELY so the user knows it worked!
          try {
            workbookRef.current?.setCellValue?.(r, 2, noSpm);
          } catch (e) {
            console.error("Failed to visually update padded SPM cell", e);
          }
        }

        const namaRekanan = getCellStringVal(3);
        
        const rawNilaiCell = rowCells[4];
        const rawNilai = rawNilaiCell?.v !== undefined ? rawNilaiCell.v : rawNilaiCell?.m;
        const nilaiKwitansi = typeof rawNilai === 'number' ? rawNilai : Number(String(rawNilai || '').replace(/[^0-9]/g, '')) || 0;

        const bidang = getCellStringVal(5) || userBidang;
        const kodeSubKegiatan = getCellStringVal(6);
        const pekerjaan = getCellStringVal(7);
        const noSp2d = getCellStringVal(8);
        const tglCairSp2d = getCellStringVal(9);

        // Skip completely blank rows
        if (!tglAntarBerkas && !noSpm && !namaRekanan && !noSp2d && !pekerjaan && nilaiKwitansi === 0) {
          continue;
        }

        // Map `r` (Grid Row) back to `data` array index (r - 1)
        const existingRow = data[r - 1];

        if (existingRow && existingRow.id) {
          // Update existing Firestore row
          console.log(`Updating existing row ${r}:`, { id: existingRow.id, noSpm, namaRekanan });
          await updateRegistrationInFirestore(existingRow.id, {
            tglAntarBerkas,
            noSpm,
            namaRekanan,
            nilaiKwitansi,
            bidang,
            kodeSubKegiatan,
            pekerjaan,
            noSp2d,
            tglCairSp2d,
          });
          savedCount++;
        } else if (tglAntarBerkas || noSpm || namaRekanan || noSp2d || pekerjaan || nilaiKwitansi > 0) {
          // Add new row to Firestore
          console.log(`Adding new row ${r} to Firestore:`, { tglAntarBerkas, noSpm, namaRekanan });
          await addRegistrationToFirestore({
            tglAntarBerkas,
            noSpm,
            namaRekanan,
            nilaiKwitansi,
            bidang: bidang || userBidang,
            kodeSubKegiatan,
            pekerjaan,
            noSp2d,
            tglCairSp2d,
          });
          savedCount++;
        }
      }
      console.log(`Save complete. Saved ${savedCount} rows.`);
      onSaveSuccess?.();
    } catch (err) {
      console.error('Failed to sync canvas edit to Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [data, isAdmin, isKeuangan, userBidang, onSaveSuccess]);

  // Expose saveData method to parent
  useImperativeHandle(ref, () => ({
    saveData: syncToFirestore,
  }));

  // Handle cell edit change (Fallback)
  const onChange = useCallback(
    (workbookData: any[]) => {
      const sheet = workbookData?.[0];
      if (!sheet || !sheet.data) return;
      currentSheetDataRef.current = sheet.data;
    },
    []
  );

  return (
    <div className="bg-white flex-1 w-full h-full flex flex-col relative overflow-hidden select-text">
      {/* FortuneSheet Canvas Container - NATIVE COMPONENT WITHOUT HTML HEADER OVERLAYS */}
      <div className="flex-1 w-full h-full relative font-sans">
        <Workbook
          ref={workbookRef}
          data={sheets}
          onChange={onChange}
          showToolbar={canEditSpreadsheet}
          showFormulaBar={true}
          allowEdit={canEditSpreadsheet}
        />
      </div>
    </div>
  );
});

export default SpreadsheetGrid;
