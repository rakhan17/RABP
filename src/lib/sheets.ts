import type { Sp2dRegistration } from '../types';

// The URL from Google Apps Script deployment
const SCRIPT_URL = import.meta.env.VITE_SHEETS_API_URL || 'PASTE_YOUR_WEB_APP_URL_HERE';

let cachedData: Sp2dRegistration[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Format ISO/YYYY-MM-DD date to Indonesian date string "30 Juli 2026"
export const formatDateToIndonesian = (dateStr: string) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();

  // If already Indonesian format "30 Juli 2026", return as is
  if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(str)) {
    return str;
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // If YYYY-MM-DD format (from input date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (monthIdx >= 0 && monthIdx < 12 && day > 0) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }

  // If ISO string or JS Date string, parse using local timezone getters
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const monthIdx = d.getMonth();
    const day = d.getDate(); // Uses Local Timezone (WIB) so 17:00 UTC shifts to 00:00 local next day!
    return `${day} ${months[monthIdx]} ${year}`;
  }

  return str;
};

export async function getRegistrations(forceRefresh = false): Promise<Sp2dRegistration[]> {
  if (!forceRefresh && cachedData && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const res = await fetch(SCRIPT_URL);
    if (!res.ok) throw new Error('Gagal mengambil data dari Google Sheets');
    const data = await res.json();

    if (!Array.isArray(data)) {
      if (data && data.error) throw new Error(data.error);
      return [];
    }

    const getStr = (val: any) => (val !== null && val !== undefined ? String(val).trim() : '');
    const getNum = (val: any) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const mappedData: Sp2dRegistration[] = data.map((row: any, index: number) => ({
      id: getStr(row['ID']) || getStr(row['id']) || String(index),
      no: getNum(row['No'] || row['NO']) || index + 1,
      tglAntarBerkas: formatDateToIndonesian(getStr(row['Tanggal Antar Berkas'] || row['Tgl Antar Berkas'])),
      noSpm: getStr(row['No SPM'] || row['NO SPM'] || row['Spm']),
      namaRekanan: getStr(row['Nama Rekanan'] || row['Rekanan']),
      nilaiKwitansi: getNum(row['Nilai Kwitansi'] || row['NILAI KWITANSI'] || row['Nilai']),
      bidang: getStr(row['BIDANG'] || row['Nama Bidang'] || row['Bidang']),
      kodeSubKegiatan: getStr(row['Kode Sub Kegiatan'] || row['Sub Kegiatan'] || row['KODE SUB KEGIATAN']),
      pekerjaan: getStr(row['Keterangan'] || row['Pekerjaan'] || row['KETERANGAN']),
      noSp2d: getStr(row['No SP2D'] || row['NO SP2D'] || row['Sp2d']),
      tglCairSp2d: formatDateToIndonesian(getStr(row['Tanggal Cair SP2D'] || row['Tgl Cair SP2D'] || row['TGL'])),
    }));

    // Filter out rows where ALL fields are completely blank / zero
    cachedData = mappedData.filter((item) => {
      return (
        item.tglAntarBerkas !== '' ||
        item.noSpm !== '' ||
        item.namaRekanan !== '' ||
        item.nilaiKwitansi !== 0 ||
        item.bidang !== '' ||
        item.kodeSubKegiatan !== '' ||
        item.pekerjaan !== '' ||
        item.noSp2d !== '' ||
        item.tglCairSp2d !== ''
      );
    });

    lastFetchTime = Date.now();
    return cachedData;
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    throw error;
  }
}

export function clearCache() {
  cachedData = null;
}

export async function addRegistration(data: Omit<Sp2dRegistration, 'id' | 'no'>) {
  const formattedTglAntar = formatDateToIndonesian(data.tglAntarBerkas);
  const formattedTglCair = formatDateToIndonesian(data.tglCairSp2d);

  const payload = {
    'Tanggal Antar Berkas': formattedTglAntar,
    'Tgl Antar Berkas': formattedTglAntar,
    'No SPM': data.noSpm,
    'Nama Rekanan': data.namaRekanan,
    'Nilai Kwitansi': data.nilaiKwitansi,
    'Nama Bidang': data.bidang,
    'BIDANG': data.bidang,
    'Bidang': data.bidang,
    'Kode Sub Kegiatan': data.kodeSubKegiatan,
    'Sub Kegiatan': data.kodeSubKegiatan,
    'Keterangan': data.pekerjaan,
    'Pekerjaan': data.pekerjaan,
    'No SP2D': data.noSp2d,
    'Tanggal Cair SP2D': formattedTglCair,
    'Tgl Cair SP2D': formattedTglCair,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'add',
        payload,
      }),
    });
    clearCache();
    const result = await res.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('Failed to add data to Google Sheets:', error);
    throw error;
  }
}

export async function updateRegistration(id: string, data: Omit<Sp2dRegistration, 'id' | 'no'>) {
  const formattedTglAntar = formatDateToIndonesian(data.tglAntarBerkas);
  const formattedTglCair = formatDateToIndonesian(data.tglCairSp2d);

  const payload = {
    'Tanggal Antar Berkas': formattedTglAntar,
    'Tgl Antar Berkas': formattedTglAntar,
    'No SPM': data.noSpm,
    'Nama Rekanan': data.namaRekanan,
    'Nilai Kwitansi': data.nilaiKwitansi,
    'Nama Bidang': data.bidang,
    'BIDANG': data.bidang,
    'Bidang': data.bidang,
    'Kode Sub Kegiatan': data.kodeSubKegiatan,
    'Sub Kegiatan': data.kodeSubKegiatan,
    'Keterangan': data.pekerjaan,
    'Pekerjaan': data.pekerjaan,
    'No SP2D': data.noSp2d,
    'Tanggal Cair SP2D': formattedTglCair,
    'Tgl Cair SP2D': formattedTglCair,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'update',
        id: id,
        payload,
      }),
    });
    clearCache();
    const result = await res.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('Failed to update data in Google Sheets:', error);
    throw error;
  }
}

export async function deleteRegistration(id: string) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'delete',
        id: id,
      }),
    });
    clearCache();
    const result = await res.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('Failed to delete data in Google Sheets:', error);
    throw error;
  }
}
