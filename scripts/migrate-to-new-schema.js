import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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

async function run() {
  console.log('Fetching existing sp2d_registrations...');
  const oldRef = collection(db, "sp2d_registrations");
  const snapshot = await getDocs(oldRef);
  
  const sppRef = collection(db, "spp_data");
  const spmRef = collection(db, "spm_data");
  const sp2dRef = collection(db, "sp2d_data");
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Create SPP
    const sppDoc = doc(sppRef);
    batch.set(sppDoc, {
      id: sppDoc.id,
      tanggalSpp: data.tglAntarBerkas || '',
      nomorSpp: data.noSpm || '', // using noSpm as fallback
      unitSkpd: data.bidang || '',
      namaPenerima: data.namaRekanan || '',
      keterangan: data.pekerjaan || '',
      jenisSpp: '',
      nilaiBruto: data.nilaiKwitansi || 0,
      nilaiPotongan: 0,
      nilaiNeto: data.nilaiKwitansi || 0,
      bidang: data.bidang || '',
      subKegiatan: data.kodeSubKegiatan || '',
      createdAt: data.createdAt || new Date().toISOString()
    });

    // Create SPM
    const spmDoc = doc(spmRef);
    batch.set(spmDoc, {
      id: spmDoc.id,
      tanggalSpm: data.tglAntarBerkas || '',
      nomorSpm: data.noSpm || '',
      unitSkpd: data.bidang || '',
      namaPenerima: data.namaRekanan || '',
      keterangan: data.pekerjaan || '',
      jenisSpm: '',
      nilaiBruto: data.nilaiKwitansi || 0,
      nilaiPotongan: 0,
      nilaiNeto: data.nilaiKwitansi || 0,
      createdAt: data.createdAt || new Date().toISOString()
    });

    // Create SP2D
    const sp2dDoc = doc(sp2dRef);
    batch.set(sp2dDoc, {
      id: sp2dDoc.id,
      tanggalSp2dPembuatan: '',
      tanggalSp2dPencairan: data.tglCairSp2d || '',
      nomorSp2d: data.noSp2d || '',
      unitSkpd: data.bidang || '',
      namaPenerima: data.namaRekanan || '',
      keterangan: data.pekerjaan || '',
      jenisSp2d: '',
      pajakJenis: '',
      pajakNama: '',
      pajakJumlah: 0,
      kodeBiling: '',
      nomorNtpn: '',
      createdAt: data.createdAt || new Date().toISOString()
    });
    
    count++;
    if (count % 100 === 0) {
      await batch.commit();
      batch = writeBatch(db);
      console.log(`Migrated ${count} docs to 3 collections...`);
    }
  }
  
  if (count % 100 !== 0) {
    await batch.commit();
  }
  
  console.log(`Successfully migrated ${count} entries into SPP, SPM, and SP2D collections!`);
  process.exit(0);
}

run().catch(console.error);
