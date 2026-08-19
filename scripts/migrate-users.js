import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

const USERS = [
  { username: 'Keuangan', password: 'DPU01', role: 'admin', bidang: 'Keuangan' },
  { username: 'Sekretariat', password: 'DPU02', role: 'viewer', bidang: 'Sekretariat' },
  { username: 'Bidang JJ', password: 'DPU03', role: 'viewer', bidang: 'Bidang JJ' },
  { username: 'Bidang SDA', password: 'DPU04', role: 'viewer', bidang: 'Bidang SDA' },
  { username: 'Bidang PLP', password: 'DPU05', role: 'viewer', bidang: 'Bidang PLP' },
  { username: 'Bidang GP', password: 'DPU06', role: 'viewer', bidang: 'Bidang GP' },
  { username: 'UPTD Drainase', password: 'DPU07', role: 'viewer', bidang: 'UPTD Drainase' },
  { username: 'UPTD JJ', password: 'DPU08', role: 'viewer', bidang: 'UPTD JJ' },
];

async function migrate() {
  console.log("Starting migration...");
  for (const user of USERS) {
    try {
      const docId = user.username.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, "users", docId), user);
      console.log(`Successfully migrated user: ${user.username}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.username}:`, error);
    }
  }
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
