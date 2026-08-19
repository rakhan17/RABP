import xlsx from 'xlsx';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDC87zcVFkhL3xvGV8_ArXgLHa4OdYO7P0",
  authDomain: "rabp-473e4.firebaseapp.com",
  projectId: "rabp-473e4",
  storageBucket: "rabp-473e4.firebasestorage.app",
  messagingSenderId: "450440073157",
  appId: "1:450440073157:web:54b3ea843eaa65116085ac",
  measurementId: "G-BBLBH24W1R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(colName) {
  console.log(`Clearing ${colName}...`);
  const colRef = collection(db, colName);
  const snapshot = await getDocs(colRef);
  let batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 400 !== 0) {
    await batch.commit();
  }
  console.log(`Cleared ${count} docs from ${colName}.`);
}

function parseDateStr(str) {
  if (!str) return '';
  return String(str).trim();
}

function parseNum(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

async function run() {
  await clearCollection('spp_data');
  await clearCollection('spm_data');
  await clearCollection('sp2d_data');
  await clearCollection('sp2d_registrations'); // old collection

  const wb = xlsx.readFile('/Applications/Mind/RABP/updatedata/updatedata2/Data Rakhan.xlsx');
  
  let sheet = wb.Sheets['SPP'];
  let rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  let items = [];
  // Row 0,1 are headers. Data starts at row 2
  for(let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || (!row[1] && !row[4])) continue;
    if (String(row[1]).includes('Tanggal') || String(row[1]).includes('Pembuatan') || String(row[2]).includes('Nomor') || String(row[4]).includes('Nama Penerima')) continue;
    items.push({
      tanggalSpp: parseDateStr(row[1]),
      nomorSpp: String(row[2] || ''),
      unitSkpd: String(row[3] || ''),
      namaPenerima: String(row[4] || ''),
      keterangan: String(row[5] || ''),
      jenisSpp: String(row[6] || ''),
      nilaiBruto: parseNum(row[7]),
      nilaiPotongan: parseNum(row[8]),
      nilaiNeto: parseNum(row[9]),
      bidang: String(row[10] || ''),
      subKegiatan: String(row[11] || ''),
      createdAt: new Date().toISOString()
    });
  }
  
  let batch = writeBatch(db);
  let count = 0;
  for (const item of items) {
    const newDocRef = doc(collection(db, 'spp_data'));
    batch.set(newDocRef, item);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 400 !== 0) await batch.commit();
  console.log(`Inserted ${count} SPP records.`);

  // SPM
  sheet = wb.Sheets['SPM'];
  rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  items = [];
  for(let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || (!row[1] && !row[4])) continue;
    if (String(row[1]).includes('Tanggal') || String(row[1]).includes('Pembuatan') || String(row[2]).includes('Nomor') || String(row[4]).includes('Nama Penerima')) continue;
    items.push({
      tanggalSpm: parseDateStr(row[1]),
      nomorSpm: String(row[2] || ''),
      unitSkpd: String(row[3] || ''),
      namaPenerima: String(row[4] || ''),
      keterangan: String(row[5] || ''),
      jenisSpm: String(row[6] || ''),
      nilaiBruto: parseNum(row[7]),
      nilaiPotongan: parseNum(row[8]),
      nilaiNeto: parseNum(row[9]),
      createdAt: new Date().toISOString()
    });
  }
  batch = writeBatch(db);
  count = 0;
  for (const item of items) {
    const newDocRef = doc(collection(db, 'spm_data'));
    batch.set(newDocRef, item);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 400 !== 0) await batch.commit();
  console.log(`Inserted ${count} SPM records.`);

  // SP2D
  sheet = wb.Sheets['sp2d pajak '] || wb.Sheets['sp2d pajak'];
  rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  items = [];
  for(let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || (!row[1] && !row[4])) continue;
    if (String(row[1]).includes('Tanggal') || String(row[1]).includes('Pembuatan') || String(row[2]).includes('Nomor') || String(row[4]).includes('Nama Penerima')) continue;
    items.push({
      tanggalSp2dPembuatan: parseDateStr(row[1]),
      tanggalSp2dPencairan: parseDateStr(row[2]),
      nomorSp2d: String(row[3] || ''),
      unitSkpd: String(row[4] || ''),
      namaPenerima: String(row[5] || ''),
      keterangan: String(row[6] || ''),
      jenisSp2d: String(row[7] || ''),
      pajakJenis: String(row[8] || ''),
      pajakNama: String(row[9] || ''),
      pajakJumlah: parseNum(row[10]),
      kodeBiling: String(row[11] || ''),
      nomorNtpn: String(row[12] || ''),
      createdAt: new Date().toISOString()
    });
  }
  batch = writeBatch(db);
  count = 0;
  for (const item of items) {
    const newDocRef = doc(collection(db, 'sp2d_data'));
    batch.set(newDocRef, item);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 400 !== 0) await batch.commit();
  console.log(`Inserted ${count} SP2D records.`);

  console.log("All done!");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
