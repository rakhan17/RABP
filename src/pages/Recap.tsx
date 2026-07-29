import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { BINDANG_LIST } from '../lib/users';
import { FileDown, Download, Filter, FileSpreadsheet, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Recap() {
  const { data, loading, isKeuangan, userBidang } = useData();
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);

  // 2 Recap Types: 'antar_berkas' | 'pencairan_sp2d'
  const [recapType, setRecapType] = useState<'antar_berkas' | 'pencairan_sp2d'>('antar_berkas');

  // Filters
  const [bidang, setBidang] = useState(isKeuangan ? '' : userBidang);
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  // Lock bidang for non-Keuangan users
  useEffect(() => {
    if (!isKeuangan && userBidang) {
      setBidang(userBidang);
    }
  }, [isKeuangan, userBidang]);

  useEffect(() => {
    const parseToIsoDate = (dateStr: string) => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

      const months: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
      };

      const parts = dateStr.toLowerCase().split(/\s+/);
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }

      return dateStr;
    };

    let result = data;

    if (bidang) {
      const bNorm = bidang.toLowerCase().trim();
      result = result.filter((item) => item.bidang && item.bidang.toLowerCase().trim() === bNorm);
    }

    if (tglMulai) {
      result = result.filter((item) => {
        const itemDate = parseToIsoDate(item.tglAntarBerkas);
        return itemDate >= tglMulai;
      });
    }

    if (tglSelesai) {
      result = result.filter((item) => {
        const itemDate = parseToIsoDate(item.tglAntarBerkas);
        return itemDate && itemDate <= tglSelesai;
      });
    }

    setFilteredData(result);
  }, [bidang, tglMulai, tglSelesai, data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    let exportData: any[] = [];
    let wscols: any[] = [];
    let sheetName = '';

    if (recapType === 'antar_berkas') {
      // 1. Rekap Antar Berkas
      sheetName = 'Rekap Antar Berkas';
      exportData = filteredData.map((item, index) => ({
        'No.': index + 1,
        'Tanggal Antar Berkas': item.tglAntarBerkas || '',
        'No. SPM': item.noSpm || '',
        'Nama Rekanan': item.namaRekanan || '',
        'Nilai Kwitansi (Rp)': item.nilaiKwitansi || 0,
        'Uraian / Pekerjaan': item.pekerjaan || '',
      }));
      wscols = [{ wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 22 }, { wch: 45 }];
    } else {
      // 2. Rekap Pencairan SP2D
      sheetName = 'Rekap Pencairan SP2D';
      exportData = filteredData.map((item, index) => ({
        'No.': index + 1,
        'Tanggal Antar Berkas': item.tglAntarBerkas || '',
        'No. SPM': item.noSpm || '',
        'Nama Rekanan': item.namaRekanan || '',
        'Nilai Kwitansi (Rp)': item.nilaiKwitansi || 0,
        'Nama Bidang': item.bidang || '',
        'Kode Sub Kegiatan': item.kodeSubKegiatan || '',
        'Uraian / Pekerjaan': item.pekerjaan || '',
        'No. SP2D': item.noSp2d || '',
        'Tanggal Cair SP2D': item.tglCairSp2d || '',
      }));
      wscols = [
        { wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 30 },
        { wch: 22 }, { wch: 25 }, { wch: 20 }, { wch: 45 },
        { wch: 25 }, { wch: 18 },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const cleanBidang = (bidang || userBidang || 'Semua_Bidang').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sheetName.replace(/\s+/g, '_')}_${cleanBidang}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const downloadPDF = () => {
    window.print();
  };

  const totalNilaiKwitansi = filteredData.reduce((sum, item) => sum + (Number(item.nilaiKwitansi) || 0), 0);

  return (
    <div className="space-y-5 font-sans print-container">
      {/* 2 Types Selection Header & Action Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-[#0f9d58]" />
              <span>Pilih Jenis Rekapitulasi Laporan</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Pilih jenis format rekap yang ingin ditampilkan dan diexport</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadPDF}
              disabled={loading || filteredData.length === 0}
              className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={loading || filteredData.length === 0}
              className="flex items-center space-x-1.5 bg-[#0f9d58] hover:bg-emerald-700 text-white disabled:bg-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* 2 Radio Tab Options for Recap Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            onClick={() => setRecapType('antar_berkas')}
            className={`p-3 rounded-lg border cursor-pointer flex items-start space-x-3 transition-all ${
              recapType === 'antar_berkas'
                ? 'bg-emerald-50/80 border-[#0f9d58] ring-1 ring-[#0f9d58]'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name="recap_type"
              checked={recapType === 'antar_berkas'}
              onChange={() => setRecapType('antar_berkas')}
              className="mt-0.5 text-[#0f9d58] focus:ring-[#0f9d58]"
            />
            <div>
              <h4 className="text-xs font-bold text-gray-900">1. Rekap Antar Berkas</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Format ringkas: Tgl Antar Berkas, No SPM, Nama Rekanan, Nilai, Uraian/Pekerjaan.
              </p>
            </div>
          </label>

          <label
            onClick={() => setRecapType('pencairan_sp2d')}
            className={`p-3 rounded-lg border cursor-pointer flex items-start space-x-3 transition-all ${
              recapType === 'pencairan_sp2d'
                ? 'bg-emerald-50/80 border-[#0f9d58] ring-1 ring-[#0f9d58]'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name="recap_type"
              checked={recapType === 'pencairan_sp2d'}
              onChange={() => setRecapType('pencairan_sp2d')}
              className="mt-0.5 text-[#0f9d58] focus:ring-[#0f9d58]"
            />
            <div>
              <h4 className="text-xs font-bold text-gray-900">2. Rekap Pencairan SP2D</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Format lengkap: Tgl Antar, No SPM, Rekanan, Nilai, Bidang, Sub Kegiatan, Pekerjaan, No SP2D, Tgl SP2D.
              </p>
            </div>
          </label>
        </div>

        {/* Filter Inputs Bar */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 mb-2">
            <Filter className="h-3.5 w-3.5 text-[#0f9d58]" />
            <span>Filter Data</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Pilih Bidang</label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                disabled={!isKeuangan}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800 text-xs font-medium disabled:opacity-60"
              >
                <option value="">-- Semua Bidang --</option>
                {BINDANG_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Dari Tanggal (Antar Berkas)</label>
              <input
                type="date"
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sampai Tanggal (Antar Berkas)</label>
              <input
                type="date"
                value={tglSelesai}
                onChange={(e) => setTglSelesai(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Title Header */}
      <div className="hidden print:block print-header mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold text-black uppercase">
          Laporan {recapType === 'antar_berkas' ? 'Rekapitulasi Antar Berkas' : 'Rekapitulasi Pencairan SP2D'}
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Bidang: <span className="font-semibold">{bidang || 'Semua Bidang'}</span> | Periode:{' '}
          <span className="font-semibold">
            {tglMulai ? tglMulai : 'Awal'} s/d {tglSelesai ? tglSelesai : 'Akhir'}
          </span>
        </p>
      </div>

      {/* Table Container for Selected Recap Type */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs print-fullscreen">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center no-print">
          <div className="text-xs font-bold text-gray-700 flex items-center space-x-2">
            <Layers className="h-4 w-4 text-[#0f9d58]" />
            <span>Tabel {recapType === 'antar_berkas' ? 'Rekap Antar Berkas' : 'Rekap Pencairan SP2D'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-700">
              Total Kwitansi: <span className="text-[#0f9d58] text-sm font-extrabold ml-1">{formatCurrency(totalNilaiKwitansi)}</span>
            </span>
            <span className="bg-emerald-50 text-[#0f9d58] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {filteredData.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar print-table-wrapper">
          {recapType === 'antar_berkas' ? (
            /* 1. Tabel Rekap Antar Berkas (6 Columns) */
            <table className="min-w-full divide-y divide-gray-200 text-xs border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-wider print:static">
                <tr className="divide-x divide-gray-200">
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2 text-left">Tgl Antar Berkas</th>
                  <th className="px-3 py-2 text-left">No SPM</th>
                  <th className="px-3 py-2 text-left">Nama Rekanan</th>
                  <th className="px-3 py-2 text-right">Nilai Kwitansi (Rp)</th>
                  <th className="px-3 py-2 text-left">Uraian / Pekerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">
                      Tidak ada data rekapitulasi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors divide-x divide-gray-100 print:break-inside-avoid">
                      <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px] bg-gray-50/50 print:bg-transparent">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{row.tglAntarBerkas || '-'}</td>
                      <td className="px-3 py-2 font-mono font-medium text-gray-800 whitespace-nowrap">{row.noSpm || '-'}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 truncate max-w-[200px] print:max-w-none">{row.namaRekanan || '-'}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap print:text-black">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[350px] print:max-w-none print:whitespace-normal">{row.pekerjaan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-gray-50 font-bold text-gray-800 border-t-2 border-gray-200">
                  <tr className="divide-x divide-gray-200">
                    <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px] tracking-wider text-gray-500">
                      Total Kwitansi ({filteredData.length} Records):
                    </td>
                    <td className="px-3 py-2 text-right text-[#0f9d58] text-xs font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            /* 2. Tabel Rekap Pencairan SP2D (10 Columns) */
            <table className="min-w-full divide-y divide-gray-200 text-xs border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-wider print:static">
                <tr className="divide-x divide-gray-200">
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2 text-left">Tgl Antar</th>
                  <th className="px-3 py-2 text-left">No SPM</th>
                  <th className="px-3 py-2 text-left">Nama Rekanan</th>
                  <th className="px-3 py-2 text-right">Nilai Kwitansi (Rp)</th>
                  <th className="px-3 py-2 text-left">Nama Bidang</th>
                  <th className="px-3 py-2 text-left">Sub Kegiatan</th>
                  <th className="px-3 py-2 text-left">Uraian / Pekerjaan</th>
                  <th className="px-3 py-2 text-left">No SP2D</th>
                  <th className="px-3 py-2 text-left">Tgl Cair SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-xs text-gray-400">
                      Tidak ada data rekapitulasi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors divide-x divide-gray-100 print:break-inside-avoid">
                      <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px] bg-gray-50/50 print:bg-transparent">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{row.tglAntarBerkas || '-'}</td>
                      <td className="px-3 py-2 font-mono font-medium text-gray-800 whitespace-nowrap">{row.noSpm || '-'}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 truncate max-w-[180px] print:max-w-none">{row.namaRekanan || '-'}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap print:text-black">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[140px] print:max-w-none">{row.bidang || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.kodeSubKegiatan || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[240px] print:max-w-none print:whitespace-normal">{row.pekerjaan || '-'}</td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-600 whitespace-nowrap print:text-black">{row.noSp2d || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.tglCairSp2d || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-gray-50 font-bold text-gray-800 border-t-2 border-gray-200">
                  <tr className="divide-x divide-gray-200">
                    <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px] tracking-wider text-gray-500">
                      Total Kwitansi ({filteredData.length} Records):
                    </td>
                    <td className="px-3 py-2 text-right text-[#0f9d58] text-xs font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td colSpan={5} className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
