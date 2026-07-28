import React, { useState, useRef, useEffect } from 'react';
import type { Sp2dRegistration } from '../types';
import { updateRegistrationInFirestore, addRegistrationToFirestore } from '../lib/firestoreService';
import { BINDANG_LIST } from '../lib/users';
import { RefreshCw, Layers, Calculator } from 'lucide-react';

interface SpreadsheetGridProps {
  data: Sp2dRegistration[];
  isAdmin: boolean;
  userBidang: string;
  isKeuangan: boolean;
}

type ColumnKey = keyof Omit<Sp2dRegistration, 'id'>;

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  excelCol: string; // A, B, C...
  width: string;
  type: 'text' | 'date' | 'number' | 'select';
  options?: string[];
}

const COLUMNS: ColumnConfig[] = [
  { key: 'no', label: 'No', excelCol: 'A', width: 'w-14 text-center', type: 'number' },
  { key: 'tglAntarBerkas', label: 'Tgl Antar Berkas', excelCol: 'B', width: 'min-w-[130px]', type: 'date' },
  { key: 'noSpm', label: 'No SPM', excelCol: 'C', width: 'min-w-[130px] font-mono', type: 'text' },
  { key: 'namaRekanan', label: 'Nama Rekanan', excelCol: 'D', width: 'min-w-[200px]', type: 'text' },
  { key: 'nilaiKwitansi', label: 'Nilai Kwitansi', excelCol: 'E', width: 'min-w-[160px] text-right font-medium text-blue-600', type: 'number' },
  { key: 'bidang', label: 'Bidang', excelCol: 'F', width: 'min-w-[180px]', type: 'select', options: BINDANG_LIST },
  { key: 'kodeSubKegiatan', label: 'Sub Kegiatan', excelCol: 'G', width: 'min-w-[140px]', type: 'text' },
  { key: 'pekerjaan', label: 'Pekerjaan', excelCol: 'H', width: 'min-w-[240px]', type: 'text' },
  { key: 'noSp2d', label: 'No SP2D', excelCol: 'I', width: 'min-w-[160px] font-mono font-medium text-green-600', type: 'text' },
  { key: 'tglCairSp2d', label: 'Tgl Cair SP2D', excelCol: 'J', width: 'min-w-[130px]', type: 'date' },
];

export default function SpreadsheetGrid({
  data,
  isAdmin,
  userBidang,
  isKeuangan,
}: SpreadsheetGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; colKey: ColumnKey } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: ColumnKey } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');
  const [isSavingCell, setIsSavingCell] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Statistics / Formulas
  const totalNilaiKwitansi = data.reduce((sum, item) => sum + (Number(item.nilaiKwitansi) || 0), 0);
  const totalRows = data.length;

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleCellClick = (row: Sp2dRegistration, colKey: ColumnKey) => {
    setSelectedCell({ rowId: row.id!, colKey });
  };

  const handleCellDoubleClick = (row: Sp2dRegistration, colKey: ColumnKey) => {
    if (!isAdmin && !isKeuangan && row.bidang !== userBidang) return; // Permission check
    setSelectedCell({ rowId: row.id!, colKey });
    setEditingCell({ rowId: row.id!, colKey });
    setCellValue(String(row[colKey] ?? ''));
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    const { rowId, colKey } = editingCell;
    const targetRow = data.find((r) => r.id === rowId);
    if (!targetRow) return;

    let newValue: any = cellValue;
    if (colKey === 'nilaiKwitansi') {
      const cleaned = String(cellValue).replace(/[^0-9]/g, '');
      newValue = cleaned ? Number(cleaned) : 0;
    }

    // Only update if value actually changed
    if (targetRow[colKey] !== newValue) {
      setIsSavingCell(true);
      try {
        await updateRegistrationInFirestore(rowId, { [colKey]: newValue });
      } catch (err) {
        console.error('Failed to save cell edit:', err);
        alert('Gagal menyimpan perubahan ke Firestore');
      } finally {
        setIsSavingCell(false);
      }
    }

    setEditingCell(null);
  };

  // Keyboard navigation & Paste Handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveCell();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if (!selectedCell) return;

    const rowIndex = data.findIndex((r) => r.id === selectedCell.rowId);
    const colIndex = COLUMNS.findIndex((c) => c.key === selectedCell.colKey);

    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      const row = data[rowIndex];
      if (row) {
        handleCellDoubleClick(row, selectedCell.colKey);
      }
    } else if (e.key === 'ArrowDown' && rowIndex < data.length - 1) {
      e.preventDefault();
      setSelectedCell({ rowId: data[rowIndex + 1].id!, colKey: selectedCell.colKey });
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      setSelectedCell({ rowId: data[rowIndex - 1].id!, colKey: selectedCell.colKey });
    } else if (e.key === 'ArrowRight' && colIndex < COLUMNS.length - 1) {
      e.preventDefault();
      setSelectedCell({ rowId: selectedCell.rowId, colKey: COLUMNS[colIndex + 1].key });
    } else if (e.key === 'ArrowLeft' && colIndex > 0) {
      e.preventDefault();
      setSelectedCell({ rowId: selectedCell.rowId, colKey: COLUMNS[colIndex - 1].key });
    }
  };

  // TSV / Excel Paste Handler
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (editingCell || !selectedCell || !isAdmin) return;
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    e.preventDefault();
    const rows = pasteData.split(/\r?\n/).filter((r) => r.trim() !== '');
    if (rows.length === 0) return;

    const startRowIdx = data.findIndex((r) => r.id === selectedCell.rowId);
    const startColIdx = COLUMNS.findIndex((c) => c.key === selectedCell.colKey);

    if (startRowIdx === -1 || startColIdx === -1) return;

    setIsSavingCell(true);
    try {
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const cellValues = rows[rIdx].split('\t');
        const targetRow = data[startRowIdx + rIdx];

        if (targetRow) {
          // Update existing row
          const updatePayload: any = {};
          for (let cIdx = 0; cIdx < cellValues.length; cIdx++) {
            const col = COLUMNS[startColIdx + cIdx];
            if (col && col.key !== 'no') {
              let val: any = cellValues[cIdx].trim();
              if (col.key === 'nilaiKwitansi') {
                val = Number(val.replace(/[^0-9]/g, '')) || 0;
              }
              updatePayload[col.key] = val;
            }
          }
          if (Object.keys(updatePayload).length > 0) {
            await updateRegistrationInFirestore(targetRow.id!, updatePayload);
          }
        } else {
          // Add new row for extra pasted lines
          const newPayload: any = {
            tglAntarBerkas: '',
            noSpm: '',
            namaRekanan: '',
            nilaiKwitansi: 0,
            bidang: userBidang || '',
            kodeSubKegiatan: '',
            pekerjaan: '',
            noSp2d: '',
            tglCairSp2d: '',
          };
          for (let cIdx = 0; cIdx < cellValues.length; cIdx++) {
            const col = COLUMNS[startColIdx + cIdx];
            if (col && col.key !== 'no') {
              let val: any = cellValues[cIdx].trim();
              if (col.key === 'nilaiKwitansi') {
                val = Number(val.replace(/[^0-9]/g, '')) || 0;
              }
              newPayload[col.key] = val;
            }
          }
          await addRegistrationToFirestore(newPayload);
        }
      }
    } catch (err) {
      console.error('Failed to process paste:', err);
      alert('Terjadi kesalahan saat menempel (paste) data.');
    } finally {
      setIsSavingCell(false);
    }
  };

  return (
    <div
      className="bg-white shadow-md border border-gray-300 rounded-xl overflow-hidden flex-1 flex flex-col focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    >
      {/* Spreadsheet Formula Bar & Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="flex items-center space-x-1.5 bg-white border border-gray-300 px-2.5 py-1 rounded shadow-inner font-mono font-bold text-blue-700">
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            <span>
              {selectedCell
                ? `${COLUMNS.find((c) => c.key === selectedCell.colKey)?.excelCol}${data.findIndex((r) => r.id === selectedCell.rowId) + 1}`
                : 'fx'}
            </span>
          </div>

          <div className="flex-1 bg-white border border-gray-300 px-3 py-1 rounded shadow-inner flex items-center space-x-2">
            <span className="font-semibold text-gray-400">fx</span>
            <span className="truncate text-gray-800 font-medium">
              {selectedCell
                ? String(data.find((r) => r.id === selectedCell.rowId)?.[selectedCell.colKey] ?? '-')
                : `=SUM(Nilai Kwitansi) : ${formatCurrency(totalNilaiKwitansi)}`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-600 bg-white border border-gray-300 px-3 py-1 rounded shadow-sm">
            <Calculator className="h-3.5 w-3.5 text-green-600" />
            <span>Total:</span>
            <span className="font-bold text-green-700">{formatCurrency(totalNilaiKwitansi)}</span>
          </div>

          <div className="bg-blue-50 text-blue-800 font-semibold px-2.5 py-1 rounded border border-blue-200">
            {totalRows} Baris
          </div>
        </div>
      </div>

      {/* Interactive Data Grid Table */}
      <div className="overflow-auto flex-1 custom-scrollbar relative">
        <table className="min-w-full divide-y divide-gray-300 text-xs border-collapse select-none">
          {/* Excel Header (A, B, C, D...) */}
          <thead className="bg-gray-200 sticky top-0 z-20 border-b-2 border-gray-300 shadow-xs">
            <tr className="divide-x divide-gray-300">
              <th className="px-2 py-1 text-center font-bold text-gray-500 bg-gray-200 w-12 border-b border-gray-300">#</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className={`px-3 py-1.5 text-left font-bold text-gray-700 whitespace-nowrap ${col.width}`}>
                  <div className="flex items-center justify-between">
                    <span>{col.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-1">[{col.excelCol}]</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white font-sans">
            {data.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-gray-400 italic">
                  Belum ada data di spreadsheet. Klik Tambah Data atau salin (paste) dari Excel.
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const canEditRow = isAdmin || isKeuangan || row.bidang === userBidang;

                return (
                  <tr key={row.id} className="divide-x divide-gray-200 hover:bg-blue-50/40 transition-colors">
                    {/* Row Index Number */}
                    <td className="px-2 py-1.5 text-center font-mono font-semibold text-gray-500 bg-gray-100 border-r border-gray-300">
                      {rIdx + 1}
                    </td>

                    {/* Columns */}
                    {COLUMNS.map((col) => {
                      const isSelected = selectedCell?.rowId === row.id && selectedCell?.colKey === col.key;
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                      const rawVal = row[col.key];

                      return (
                        <td
                          key={col.key}
                          onClick={() => handleCellClick(row, col.key)}
                          onDoubleClick={() => handleCellDoubleClick(row, col.key)}
                          className={`px-3 py-1.5 whitespace-nowrap relative transition-all ${col.width} ${
                            isSelected ? 'ring-2 ring-blue-600 ring-inset bg-blue-100/70 font-semibold z-10' : ''
                          } ${!canEditRow ? 'bg-gray-50/50 cursor-not-allowed' : 'cursor-cell'}`}
                        >
                          {isEditing ? (
                            <div className="absolute inset-0 z-30 flex items-center bg-white p-0.5 shadow-md">
                              {col.type === 'select' ? (
                                <select
                                  ref={inputRef as any}
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onBlur={handleSaveCell}
                                  className="w-full h-full border border-blue-500 text-xs rounded px-1 outline-none bg-white font-medium"
                                >
                                  <option value="">-- Pilih --</option>
                                  {col.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  ref={inputRef as any}
                                  type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onBlur={handleSaveCell}
                                  className="w-full h-full border border-blue-500 text-xs px-2 outline-none rounded bg-white font-medium"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="truncate">
                              {col.key === 'nilaiKwitansi'
                                ? formatCurrency(Number(rawVal) || 0)
                                : String(rawVal ?? '') || <span className="text-gray-300 font-mono text-[10px]">-</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Instructions */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
        <div>
          💡 <span className="font-semibold">Tips:</span> Klik 2x pada sel untuk mengedit langsung, atau <kbd className="bg-white border border-gray-300 px-1 rounded">Ctrl+V</kbd> untuk menempel data dari Excel/Spreadsheet.
        </div>
        {isSavingCell && (
          <div className="flex items-center space-x-1.5 text-blue-600 font-semibold animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Menyimpan ke Firebase...</span>
          </div>
        )}
      </div>
    </div>
  );
}
