import type { Sp2dRegistration } from '../types';

// The URL you get from Google Apps Script deployment
const SCRIPT_URL = import.meta.env.VITE_SHEETS_API_URL || 'PASTE_YOUR_WEB_APP_URL_HERE';

export async function getRegistrations(): Promise<Sp2dRegistration[]> {
  try {
    const res = await fetch(SCRIPT_URL);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    
    // Map the sheet columns (Header names) to our TypeScript interface
    // Headers must exactly match what's in row 1 of the Google Sheet.
    return data.map((row: any, index: number) => ({
      id: row['ID'] || String(index),
      no: parseInt(row['NO']) || index + 1,
      tglAntarBerkas: row['Tanggal Antar Berkas'] || '',
      noSpm: row['No SPM'] || '',
      namaRekanan: row['Nama Rekanan'] || '',
      nilaiKwitansi: parseInt(row['Nilai Kwitansi']) || 0,
      bidang: row['Nama Bidang'] || '',
      kodeSubKegiatan: row['Kode Sub Kegiatan'] || '',
      pekerjaan: row['Keterangan'] || '',
      noSp2d: row['No SP2D'] || '',
      tglCairSp2d: row['Tanggal Cair SP2D'] || '',
    }));
  } catch (error) {
    console.error("Failed to fetch from Google Sheets:", error);
    return [];
  }
}

export async function addRegistration(data: Omit<Sp2dRegistration, 'id' | 'no'>) {
  const payload = {
    'Tanggal Antar Berkas': data.tglAntarBerkas,
    'No SPM': data.noSpm,
    'Nama Rekanan': data.namaRekanan,
    'Nilai Kwitansi': data.nilaiKwitansi,
    'Nama Bidang': data.bidang,
    'Kode Sub Kegiatan': data.kodeSubKegiatan,
    'Keterangan': data.pekerjaan,
    'No SP2D': data.noSp2d,
    'Tanggal Cair SP2D': data.tglCairSp2d,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // Use text/plain for Google Apps Script to bypass preflight CORS issues
      },
      body: JSON.stringify({
        action: 'add',
        payload
      })
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to add data to Google Sheets:", error);
    throw error;
  }
}

export async function updateRegistration(id: string, data: Omit<Sp2dRegistration, 'id' | 'no'>) {
  const payload = {
    'Tanggal Antar Berkas': data.tglAntarBerkas,
    'No SPM': data.noSpm,
    'Nama Rekanan': data.namaRekanan,
    'Nilai Kwitansi': data.nilaiKwitansi,
    'Nama Bidang': data.bidang,
    'Kode Sub Kegiatan': data.kodeSubKegiatan,
    'Keterangan': data.pekerjaan,
    'No SP2D': data.noSp2d,
    'Tanggal Cair SP2D': data.tglCairSp2d,
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
        payload
      })
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to update data in Google Sheets:", error);
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
        id: id
      })
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to delete data in Google Sheets:", error);
    throw error;
  }
}
