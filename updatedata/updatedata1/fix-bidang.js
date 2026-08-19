import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

const mapBidang = (raw) => {
  const s = String(raw).toUpperCase().trim();
  if (s.includes('BENDAHARA') || s === '') return 'Keuangan';
  if (s.includes('SEKRETARIAT')) return 'Bidang Sekretariat';
  if (s.includes('UPTD PERAWATAN JALAN') || s.includes('UPTD JALAN')) return 'UPTD Jalan dan Jembatan';
  if (s.includes('UPTD DRAINASE')) return 'UPTD Drainase dan Bozem';
  if (s.includes('JALAN DAN JEMBATAN')) return 'Bidang Jalan dan Jembatan';
  if (s.includes('SUMBER DAYA AIR')) return 'Bidang Sumber Daya Air';
  if (s.includes('PENYEHATAN LINGKUNGAN') || s.includes('PEMUKIMAN')) return 'Bidang Penyehatan Lingkungan Permukiman';
  if (s.includes('GEDUNG PEMERINTAH')) return 'Bidang Gedung Pemerintah'; 
  return 'Keuangan';
};

async function run() {
  console.log('Fetching documents...');
  const colRef = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(colRef);
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const rawBidang = data.bidang || '';
    const mapped = mapBidang(rawBidang);
    
    if (rawBidang !== mapped) {
      batch.update(docSnap.ref, { bidang: mapped });
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
        console.log(`Updated ${count} docs...`);
      }
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit();
  }
  
  console.log(`Successfully updated ${count} documents!`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
