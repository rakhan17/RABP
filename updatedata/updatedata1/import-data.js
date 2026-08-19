import xlsx from 'xlsx';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore';

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
const COLLECTION_NAME = "sp2d_registrations";

async function run() {
  console.log('Fetching existing documents...');
  const colRef = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(colRef);
  console.log(`Found ${snapshot.docs.length} documents. Deleting...`);
  
  // Batch delete
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
  console.log('All previous documents deleted.');

  // Read excel
  const workbook = xlsx.readFile('/Applications/Mind/RABP/Pencarian Sp2d dan  Register antar berkas.xlsx');
  const sheet = workbook.Sheets['DATA '];
  // Parse skipping rows
  const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false });
  
  // Data starts at row index 3
  const items = [];
  for (let i = 3; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || (!row[1] && !row[3] && !row[4])) continue;
    
    // Parse number
    const strVal = String(row[5] || '').replace(/[^0-9.-]/g, '');
    const numVal = parseFloat(strVal) || 0;

    // Date converter to indonesian "5 Januari 2026"
    const parseDate = (d) => {
        if (!d) return '';
        return String(d)
          .replace(/January/gi, 'Januari')
          .replace(/February/gi, 'Februari')
          .replace(/March/gi, 'Maret')
          .replace(/May/gi, 'Mei')
          .replace(/August/gi, 'Agustus')
          .replace(/October/gi, 'Oktober')
          .replace(/December/gi, 'Desember')
          .trim();
    }
    
    items.push({
      no: parseInt(String(row[0]).replace(/[^0-9]/g,''), 10) || (i - 2),
      tglAntarBerkas: parseDate(row[1]),
      noSpm: row[3] ? String(row[3]).trim() : '',
      namaRekanan: row[4] ? String(row[4]).trim() : '',
      nilaiKwitansi: numVal,
      bidang: row[6] ? String(row[6]).trim() : '',
      kodeSubKegiatan: row[7] ? String(row[7]).trim() : '',
      pekerjaan: row[8] ? String(row[8]).trim() : '',
      noSp2d: row[9] ? String(row[9]).trim() : '',
      tglCairSp2d: parseDate(row[10]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  console.log(`Found ${items.length} rows to insert. Inserting...`);
  
  batch = writeBatch(db);
  count = 0;
  for (const item of items) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    batch.set(newDocRef, item);
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
      console.log(`Inserted ${count}...`);
    }
  }
  if (count % 400 !== 0) {
    await batch.commit();
  }
  
  console.log(`Successfully inserted ${count} items!`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
