import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { Sp2dRegistration } from '../types';
import { BINDANG_LIST } from '../lib/users';
import { FileDown, Download, Filter, Table2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Recap() {
  const { type } = useParams<{ type: string }>();
  const isAntarBerkas = type === 'antar-berkas';
  const recapType = isAntarBerkas ? 'antar_berkas' : 'pencairan_sp2d';

  const { data, loading, isKeuangan, userBidang } = useData();
  const [filteredData, setFilteredData] = useState<Sp2dRegistration[]>([]);

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
      exportData = filteredData.map((item, index) => {
        const bulanCalc = item.tglAntarBerkas ? new Date(item.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-';
        return {
        'No.': index + 1,
        'Tanggal Antar Berkas': item.tglAntarBerkas || '',
        'Bulan': bulanCalc,
        'No. SPM': item.noSpm || '',
        'Nama Rekanan': item.namaRekanan || '',
        'Nilai Kwitansi (Rp)': item.nilaiKwitansi || 0,
        'Keterangan': item.pekerjaan || '',
        };
      });
      wscols = [{ wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 22 }, { wch: 45 }];
    } else {
      // 2. Rekap Pencairan SP2D
      sheetName = 'Rekap Pencairan SP2D';
      exportData = filteredData.map((item, index) => {
        const bulanCalc = item.tglAntarBerkas ? new Date(item.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-';
        return {
        'No.': index + 1,
        'Bulan': bulanCalc,
        'No. SPM': item.noSpm || '',
        'Nama Rekanan': item.namaRekanan || '',
        'Nilai Kwitansi (Rp)': item.nilaiKwitansi || 0,
        'Nama Bidang': item.bidang || '',
        'Kode Sub Kegiatan': item.kodeSubKegiatan || '',
        'Keterangan': item.pekerjaan || '',
        'No. SP2D': item.noSp2d || '',
        'Tanggal Cair SP2D': item.tglCairSp2d || '',
        };
      });
      wscols = [
        { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
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
    <div className="space-y-6 font-sans print-container p-6 bg-[#f8f9fa] h-full overflow-y-auto custom-scrollbar">
      {/* 2 Types Selection Header & Action Controls */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-[#e9eef6] flex items-center justify-center text-[#0b57d0]">
              <Table2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[22px] font-normal text-[#1f1f1f] leading-tight">
                {isAntarBerkas ? 'Rekap Antar Berkas' : 'Rekap Pencairan SP2D'}
              </h3>
              <p className="text-[14px] text-[#444746] mt-0.5">Filter, Ekspor, atau Cetak Laporan</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDF}
              disabled={loading || filteredData.length === 0}
              className="flex items-center space-x-2 bg-white text-[#444746] hover:bg-gray-100 hover:text-[#1f1f1f] border border-gray-300 disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all ripple"
            >
              <Download className="h-4 w-4" strokeWidth={2.5} />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-[#f1f3f4] hover:bg-[#e2e2e2] text-[#444746] disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all ripple-dark shadow-sm"
            >
              <FileDown className="h-4 w-4" strokeWidth={2.5} />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Bar */}
        <div className="pt-5 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-[14px] font-medium text-[#1f1f1f] mb-4">
            <Filter className="h-4 w-4 text-[#444746]" />
            <span>Kriteria Filter</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Pilih Bidang</label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                disabled={!isKeuangan}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
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
              <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Dari Tanggal (Antar Berkas)</label>
              <input
                type="date"
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#444746] mb-1.5">Sampai Tanggal (Antar Berkas)</label>
              <input
                type="date"
                value={tglSelesai}
                onChange={(e) => setTglSelesai(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#1f1f1f] text-[14px] focus:ring-2 focus:ring-[#0b57d0] focus:border-[#0b57d0] outline-none transition-all"
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
        <p className="text-sm text-gray-800 mt-1">
          Bidang: <span className="font-bold">{bidang || 'Semua Bidang'}</span> | Periode:{' '}
          <span className="font-bold">
            {tglMulai ? tglMulai : 'Awal'} s/d {tglSelesai ? tglSelesai : 'Akhir'}
          </span>
        </p>
      </div>

      {/* Table Container for Selected Recap Type */}
      <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm print-fullscreen">
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center no-print">
          <div className="text-[16px] font-medium text-[#1f1f1f]">
            Data {recapType === 'antar_berkas' ? 'Rekap Antar Berkas' : 'Rekap Pencairan SP2D'}
          </div>
          <div className="flex items-center space-x-4 text-[14px]">
            <span className="text-[#444746]">
              Total: <span className="text-[#444746] font-bold ml-1">{formatCurrency(totalNilaiKwitansi)}</span>
            </span>
            <span className="bg-[#e9eef6] text-[#0b57d0] text-[13px] font-medium px-3 py-1 rounded-full">
              {filteredData.length} Data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar print-table-wrapper">
          {recapType === 'antar_berkas' ? (
            /* 1. Tabel Rekap Antar Berkas (7 Columns) */
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-white text-[12px] font-semibold text-[#444746] border-b border-gray-200 print:static">
                <tr>
                  <th className="px-5 py-4 font-medium text-center w-12">No</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Tgl Antar</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bulan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SPM</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-5 py-4 font-medium text-right whitespace-nowrap">Nilai Kwitansi</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm text-[#444746]">
                      Tidak ada data rekapitulasi yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const bulanCalc = row.tglAntarBerkas ? new Date(row.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-';
                    return (
                    <tr key={row.id} className="hover:bg-[#f8f9fa] transition-colors print:break-inside-avoid">
                      <td className="px-5 py-3.5 text-center text-[#444746] text-[13px]">{idx + 1}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[13px] text-[#444746]">{row.tglAntarBerkas || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746]">{bulanCalc}</td>
                      <td className="px-5 py-3.5 font-medium text-[13px] text-[#0b57d0] whitespace-nowrap">{row.noSpm || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] truncate max-w-[200px] print:max-w-none">{row.namaRekanan || '-'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[13px] text-[#444746] whitespace-nowrap print:text-black">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[300px] print:max-w-none print:whitespace-normal">{row.pekerjaan || '-'}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-white border-t border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-5 py-4 text-right text-[13px] font-medium text-[#444746]">
                      Total Kwitansi:
                    </td>
                    <td className="px-5 py-4 text-right text-[#444746] text-[14px] font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td className="px-5 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            /* 2. Tabel Rekap Pencairan SP2D (9 Columns) */
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-white text-[12px] font-semibold text-[#444746] border-b border-gray-200 print:static">
                <tr>
                  <th className="px-5 py-4 font-medium text-center w-12">No</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Bulan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SPM</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Rekanan</th>
                  <th className="px-5 py-4 font-medium text-right whitespace-nowrap">Nilai Kwitansi</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Nama Bidang</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Sub Kegiatan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Keterangan</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">No SP2D</th>
                  <th className="px-5 py-4 font-medium whitespace-nowrap">Tgl Cair SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center text-sm text-[#444746]">
                      Tidak ada data rekapitulasi yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const bulanCalc = row.tglAntarBerkas ? new Date(row.tglAntarBerkas).toLocaleDateString('id-ID', { month: 'long' }) : '-';
                    return (
                    <tr key={row.id} className="hover:bg-[#f8f9fa] transition-colors print:break-inside-avoid">
                      <td className="px-5 py-3.5 text-center text-[#444746] text-[13px]">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746]">{bulanCalc}</td>
                      <td className="px-5 py-3.5 font-medium text-[13px] text-[#0b57d0] whitespace-nowrap">{row.noSpm || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] truncate max-w-[180px] print:max-w-none">{row.namaRekanan || '-'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[13px] text-[#444746] whitespace-nowrap print:text-black">{formatCurrency(row.nilaiKwitansi)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[140px] print:max-w-none">{row.bidang || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{row.kodeSubKegiatan || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] truncate max-w-[240px] print:max-w-none print:whitespace-normal">{row.pekerjaan || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#1f1f1f] whitespace-nowrap print:text-black">{row.noSp2d || '-'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#444746] whitespace-nowrap">{row.tglCairSp2d || '-'}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-white border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-right text-[13px] font-medium text-[#444746]">
                      Total Kwitansi:
                    </td>
                    <td className="px-5 py-4 text-right text-[#444746] text-[14px] font-bold print:text-black">
                      {formatCurrency(totalNilaiKwitansi)}
                    </td>
                    <td colSpan={5} className="px-5 py-4"></td>
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
