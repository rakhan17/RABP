import { useMemo, useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { addToFirestore, updateInFirestore } from '../lib/firestoreService';
import { BINDANG_LIST, SUB_KEGIATAN_LIST } from '../lib/users';

export interface SpreadsheetGridRef {
  saveData: () => Promise<void>;
}

interface SpreadsheetGridProps {
  data: any[];
  inputType: 'spp' | 'spm' | 'sp2d' | 'rekap';
  isAdmin: boolean;
  userBidang: string;
  isKeuangan: boolean;
  onSyncStateChange?: (syncing: boolean) => void;
  onSaveSuccess?: () => void;
}

const CONFIG: Record<string, { collection: string, merges?: Record<string, any>, headerRows: number, headers: any[][], columns: any[] }> = {
  spp: {
    collection: 'spp_data',
    headerRows: 2,
    merges: {
      "0_0": { r: 0, c: 0, rs: 2, cs: 1 },
      "0_1": { r: 0, c: 1, rs: 2, cs: 1 },
      "0_2": { r: 0, c: 2, rs: 2, cs: 1 },
      "0_3": { r: 0, c: 3, rs: 2, cs: 1 },
      "0_4": { r: 0, c: 4, rs: 2, cs: 1 },
      "0_5": { r: 0, c: 5, rs: 2, cs: 1 },
      "0_6": { r: 0, c: 6, rs: 1, cs: 3 },
      "0_9": { r: 0, c: 9, rs: 2, cs: 1 },
      "0_10": { r: 0, c: 10, rs: 2, cs: 1 },
    },
    headers: [
      ['Tanggal SPP', 'Nomor SPP', 'Unit SKPD', 'Nama Penerima', 'Keterangan', 'Jenis SPP', 'Nilai (Rp)', null, null, 'Bidang', 'Sub kegiatan'],
      [null, null, null, null, null, null, 'Bruto', 'Potongan', 'Neto', null, null]
    ],
    columns: [
      { key: 'tanggalSpp', width: 140 },
      { key: 'nomorSpp', width: 180 },
      { key: 'unitSkpd', width: 150 },
      { key: 'namaPenerima', width: 220 },
      { key: 'keterangan', width: 300 },
      { key: 'jenisSpp', width: 140 },
      { key: 'nilaiBruto', width: 150, isCurrency: true },
      { key: 'nilaiPotongan', width: 150, isCurrency: true },
      { key: 'nilaiNeto', width: 150, isCurrency: true },
      { key: 'bidang', width: 150, isDropdown: true, dropType: 'bidang' },
      { key: 'subKegiatan', width: 150, isDropdown: true, dropType: 'subKegiatan' },
    ]
  },
  spm: {
    collection: 'spm_data',
    headerRows: 2,
    merges: {
      "0_0": { r: 0, c: 0, rs: 2, cs: 1 },
      "0_1": { r: 0, c: 1, rs: 2, cs: 1 },
      "0_2": { r: 0, c: 2, rs: 2, cs: 1 },
      "0_3": { r: 0, c: 3, rs: 2, cs: 1 },
      "0_4": { r: 0, c: 4, rs: 2, cs: 1 },
      "0_5": { r: 0, c: 5, rs: 2, cs: 1 },
      "0_6": { r: 0, c: 6, rs: 1, cs: 3 },
    },
    headers: [
      ['Tanggal SPM', 'Nomor SPM', 'Unit SKPD', 'Nama Penerima', 'Keterangan', 'Jenis SPM', 'Nilai (Rp)', null, null],
      [null, null, null, null, null, null, 'Bruto', 'Potongan', 'Neto']
    ],
    columns: [
      { key: 'tanggalSpm', width: 140 },
      { key: 'nomorSpm', width: 180 },
      { key: 'unitSkpd', width: 150 },
      { key: 'namaPenerima', width: 220 },
      { key: 'keterangan', width: 300 },
      { key: 'jenisSpm', width: 140 },
      { key: 'nilaiBruto', width: 150, isCurrency: true },
      { key: 'nilaiPotongan', width: 150, isCurrency: true },
      { key: 'nilaiNeto', width: 150, isCurrency: true },
    ]
  },
  sp2d: {
    collection: 'sp2d_data',
    headerRows: 2,
    merges: {
      "0_0": { r: 0, c: 0, rs: 1, cs: 2 },
      "0_2": { r: 0, c: 2, rs: 2, cs: 1 },
      "0_3": { r: 0, c: 3, rs: 2, cs: 1 },
      "0_4": { r: 0, c: 4, rs: 2, cs: 1 },
      "0_5": { r: 0, c: 5, rs: 2, cs: 1 },
      "0_6": { r: 0, c: 6, rs: 2, cs: 1 },
      "0_7": { r: 0, c: 7, rs: 1, cs: 3 },
      "0_10": { r: 0, c: 10, rs: 2, cs: 1 },
      "0_11": { r: 0, c: 11, rs: 2, cs: 1 },
    },
    headers: [
      ['Tanggal SP2D', null, 'Nomor SP2D', 'Unit SKPD', 'Nama Penerima', 'Keterangan', 'Jenis SP2D', 'Pajak/Potongan', null, null, 'Kode Biling', 'Nomor NTPN'],
      ['Pembuatan', 'Pencairan', null, null, null, null, null, 'Jenis', 'Nama', 'Jumlah', null, null]
    ],
    columns: [
      { key: 'tanggalSp2dPembuatan', width: 140 },
      { key: 'tanggalSp2dPencairan', width: 140 },
      { key: 'nomorSp2d', width: 180 },
      { key: 'unitSkpd', width: 150 },
      { key: 'namaPenerima', width: 220 },
      { key: 'keterangan', width: 300 },
      { key: 'jenisSp2d', width: 140 },
      { key: 'pajakJenis', width: 140 },
      { key: 'pajakNama', width: 160 },
      { key: 'pajakJumlah', width: 150, isCurrency: true },
      { key: 'kodeBiling', width: 160 },
      { key: 'nomorNtpn', width: 160 },
    ]
  },
  rekap: {
    collection: 'read_only',
    headerRows: 2,
    merges: {
      "0_0": { r: 0, c: 0, rs: 2, cs: 1 },
      "0_1": { r: 0, c: 1, rs: 2, cs: 1 },
      "0_2": { r: 0, c: 2, rs: 2, cs: 1 },
      "0_3": { r: 0, c: 3, rs: 2, cs: 1 },
      "0_4": { r: 0, c: 4, rs: 1, cs: 2 },
      "0_6": { r: 0, c: 6, rs: 2, cs: 1 },
      "0_7": { r: 0, c: 7, rs: 2, cs: 1 },
      "0_8": { r: 0, c: 8, rs: 2, cs: 1 },
      "0_9": { r: 0, c: 9, rs: 1, cs: 3 },
      "0_12": { r: 0, c: 12, rs: 1, cs: 3 },
      "0_15": { r: 0, c: 15, rs: 2, cs: 1 },
      "0_16": { r: 0, c: 16, rs: 2, cs: 1 },
      "0_17": { r: 0, c: 17, rs: 2, cs: 1 },
      "0_18": { r: 0, c: 18, rs: 2, cs: 1 },
      "0_19": { r: 0, c: 19, rs: 2, cs: 1 },
    },
    headers: [
      ['Tanggal SPP', 'Nomor SPP', 'Tanggal SPM', 'Nomor SPM', 'Tanggal SP2D', null, 'Nomor SP2D', 'Unit SKPD', 'Nama Penerima', 'Nilai (Rp)', null, null, 'Pajak/Potongan', null, null, 'Kode Biling', 'Nomor NTPN', 'Keterangan', 'Bidang', 'Sub kegiatan'],
      [null, null, null, null, 'Pembuatan', 'Pencairan', null, null, null, 'Bruto', 'Potongan', 'Neto', 'Jenis', 'Nama', 'Jumlah', null, null, null, null, null]
    ],
    columns: [
      { key: 'tanggalSpp', width: 140 },
      { key: 'nomorSpp', width: 160 },
      { key: 'tanggalSpm', width: 140 },
      { key: 'nomorSpm', width: 160 },
      { key: 'tanggalSp2dPembuatan', width: 140 },
      { key: 'tanggalSp2dPencairan', width: 140 },
      { key: 'nomorSp2d', width: 160 },
      { key: 'unitSkpd', width: 150 },
      { key: 'namaPenerima', width: 220 },
      { key: 'nilaiBruto', width: 150, isCurrency: true },
      { key: 'nilaiPotongan', width: 150, isCurrency: true },
      { key: 'nilaiNeto', width: 150, isCurrency: true },
      { key: 'pajakJenis', width: 140 },
      { key: 'pajakNama', width: 160 },
      { key: 'pajakJumlah', width: 150, isCurrency: true },
      { key: 'kodeBiling', width: 140 },
      { key: 'nomorNtpn', width: 140 },
      { key: 'keterangan', width: 300 },
      { key: 'bidang', width: 140 },
      { key: 'subKegiatan', width: 140 },
    ]
  }
};

const SpreadsheetGrid = forwardRef<SpreadsheetGridRef, SpreadsheetGridProps>(({
  data,
  inputType,
  isAdmin,
  userBidang,
  isKeuangan,
  onSyncStateChange,
  onSaveSuccess,
}, ref) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const isRekap = inputType === 'rekap';
  const canEditSpreadsheet = (isAdmin || isKeuangan) && !isRekap;
  const currentSheetDataRef = useRef<any[]>([]);
  const workbookRef = useRef<WorkbookInstance>(null);

  console.log("SPREADSHEET DATA:", inputType, data.slice(0, 2)); useEffect(() => {
    onSyncStateChange?.(isSyncing);
  }, [isSyncing, onSyncStateChange]);

  const conf = CONFIG[inputType];

  const { celldata, rowHeights, columnWidths } = useMemo(() => {
    const cells: any[] = [];
    const heights: Record<number, number> = {};
    const cWidths: Record<number, number> = {};

    for (let r = 0; r < conf.headerRows; r++) {
      heights[r] = 36;
      conf.headers[r].forEach((title, cIdx) => {
        if (r === 0) cWidths[cIdx] = conf.columns[cIdx].width;

        let mcData: any = undefined;
        let isSlave = false;
        if (conf.merges) {
          for (const m of Object.values(conf.merges)) {
            if (r >= m.r && r < m.r + m.rs && cIdx >= m.c && cIdx < m.c + m.cs) {
              if (r === m.r && cIdx === m.c) {
                mcData = m; // Main cell
              } else {
                mcData = { r: m.r, c: m.c }; // Slave cell
                isSlave = true;
              }
              break;
            }
          }
        }

        if (title !== null || isSlave) {
          cells.push({
            r,
            c: cIdx,
            v: {
              v: title || '',
              m: title || '',
              bg: '#f1f3f4',
              fc: '#444746',
              bl: 1,
              vt: 0,
              ht: 0,
              tb: 2,
              ct: { fa: '@', t: 's' },
              ...(mcData ? { mc: mcData } : {})
            },
          });
        }
      });
    }

    data.forEach((row, rIdx) => {
      const dataRow = rIdx + conf.headerRows;
      heights[dataRow] = 36;
      conf.columns.forEach((col, cIdx) => {
        const val = col.key === 'noIndex' ? rIdx + 1 : row[col.key];
        const rawStr = val !== undefined && val !== null ? String(val) : '';
        // Inject zero-width space (\u200B) for non-currency strings to completely prevent FortuneSheet from parsing it as a number
        const strVal = (!col.isCurrency && rawStr.length > 0) ? '\u200B' + rawStr : rawStr;

        cells.push({
          r: dataRow,
          c: cIdx,
          v: {
            v: col.isCurrency ? (Number(val) || 0) : strVal,
            m: col.isCurrency
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)
              : strVal,
            vt: 0,
            ht: col.isCurrency ? 2 : 1,
            tb: 2,
            ct: col.isCurrency ? undefined : { fa: '@', t: 's' },
          },
        });
      });
    });

    if (!isRekap) {
      const maxEmptyRows = Math.max(100, data.length + 30);
      for (let r = data.length + 1; r < maxEmptyRows; r++) {
        const dataRow = r - 1 + conf.headerRows;
        for (let c = 0; c < conf.columns.length; c++) {
          const isKwitan = conf.columns[c].isCurrency;
          cells.push({
            r: dataRow,
            c,
            v: {
              v: '', m: '', vt: 0, tb: 2,
              ht: isKwitan ? 2 : 1,
              ct: isKwitan ? undefined : { fa: '@', t: 's' },
            },
          });
        }
      }
    }

    return { celldata: cells, rowHeights: heights, columnWidths: cWidths };
  }, [data, conf, isRekap]);

  const sheets = useMemo(
    () => [
      {
        name: isKeuangan ? 'Semua Bidang' : userBidang || 'Input',
        color: '#e9eef6',
        status: 1,
        order: 0,
        row: isRekap ? data.length + conf.headerRows + 5 : Math.max(100, data.length + conf.headerRows + 20),
        column: conf.columns.length,
        frozen: { type: 'row' as const, range: { row_focus: conf.headerRows - 1, column_focus: 0 } },
        dataVerification: (() => {
          if (isRekap) return {};
          const dv: Record<string, any> = {};
          const maxRow = Math.max(200, data.length + 50);

          conf.columns.forEach((col, cIdx) => {
            if (col.isDropdown) {
              const options = col.dropType === 'bidang' ? BINDANG_LIST.join(',') : SUB_KEGIATAN_LIST.join(',');
              for (let r = conf.headerRows; r < maxRow; r++) {
                dv[`${r}_${cIdx}`] = {
                  type: 'dropdown',
                  type2: null,
                  value1: options,
                  value2: '',
                  checked: false,
                  prohibitInput: true,
                  hintShow: false,
                  hintText: '',
                };
              }
            }
          });
          return dv;
        })(),
        config: {
          rowlen: rowHeights,
          columnlen: columnWidths,
          merge: conf.merges || {},
        },
        celldata,
      },
    ],
    [data, celldata, rowHeights, columnWidths, isKeuangan, userBidang, conf, isRekap]
  );

  const syncToFirestore = useCallback(async () => {
    if (!canEditSpreadsheet || isRekap) return;

    const instanceData = workbookRef.current?.getAllSheets()?.[0]?.data;
    const gridData = instanceData || currentSheetDataRef.current;

    if (!gridData || gridData.length === 0) return;

    setIsSyncing(true);
    try {
      let savedCount = 0;
      for (let r = conf.headerRows; r < gridData.length; r++) {
        const rowCells = gridData[r];
        if (!rowCells) continue;

        const getCellVal = (c: number): string => {
          const cell = rowCells[c];
          if (!cell) return '';
          let valStr = '';
          if (cell.m !== undefined && cell.m !== null && String(cell.m).trim() !== '') valStr = String(cell.m);
          else if (cell.v !== undefined && cell.v !== null) valStr = String(cell.v);
          return valStr.replace(/\u200B/g, '').trim();
        };

        const payload: any = {};
        let isEmpty = true;

        conf.columns.forEach((col, cIdx) => {
          const raw = getCellVal(cIdx);
          if (raw) isEmpty = false;

          if (col.isCurrency) {
            payload[col.key] = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9]/g, '')) || 0;
          } else {
            payload[col.key] = raw;
          }
        });

        if (isEmpty) continue;

        // Auto padding zeroes for "nomor" string fields 
        conf.columns.forEach((col) => {
          if (col.key.toLowerCase().includes('nomor') && /^\d+$/.test(payload[col.key]) && payload[col.key].length < 4) {
            payload[col.key] = payload[col.key].padStart(4, '0');
          }
        });

        const existingRow = data[r - conf.headerRows];

        if (existingRow && existingRow.id) {
          await updateInFirestore(conf.collection, existingRow.id, payload);
          savedCount++;
        } else {
          await addToFirestore(conf.collection, payload);
          savedCount++;
        }
      }
      onSaveSuccess?.();
    } catch (err) {
      console.error('Failed to sync canvas edit to Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [data, canEditSpreadsheet, isRekap, conf, onSaveSuccess]);

  useImperativeHandle(ref, () => ({
    saveData: syncToFirestore,
  }));

  const onChange = useCallback(
    (workbookData: any[]) => {
      if (isRekap) return;
      const sheet = workbookData?.[0];
      if (!sheet || !sheet.data) return;
      currentSheetDataRef.current = sheet.data;
    },
    [isRekap]
  );

  return (
    <div className="bg-white flex-1 w-full h-full flex flex-col relative overflow-hidden select-text">
      {isRekap && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-50 text-yellow-800 text-xs font-medium px-4 py-1.5 text-center z-10 border-b border-yellow-200">
          Mode Rekap: Tabel ini otomatis menggabungkan data dari SPP, SPM, dan SP2D berdasarkan Nama Penerima dan Keterangan. (Hanya Baca)
        </div>
      )}
      <div className={`flex-1 w-full h-full relative font-sans ${isRekap ? 'mt-7' : ''}`}>
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
