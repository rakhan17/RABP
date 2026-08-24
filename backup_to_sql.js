import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Ignore TLS for node env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const firebaseConfig = {
  apiKey: "AIzaSyDC87zcVFkhL3xvGV8_ArXgLHa4OdYO7P0",
  projectId: "rabp-473e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sanitize = (val) => {
  if (val === undefined || val === null) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'object') {
    if (val.toDate) { // Firebase Timestamp
      return `'${val.toDate().toISOString()}'`;
    }
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return val;
};

const collections = ['spp_data', 'spm_data', 'sp2d_data', 'users', 'roles', 'tanda_terima'];

async function exportToSQL() {
  let sql = '-- Firebase to SQL Backup\n\n';
  
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      if (snap.empty) {
        console.log(`Collection ${collName} is empty.`);
        continue;
      }
      
      console.log(`Exporting ${collName}... (${snap.size} docs)`);
      
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const keys = Array.from(new Set(docs.flatMap(d => Object.keys(d))));
      
      sql += `-- Table: ${collName}\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${collName} (\n`;
      sql += keys.map(k => `  "${k}" TEXT`).join(',\n');
      sql += `\n);\n\n`;
      
      for (const doc of docs) {
        const columns = Object.keys(doc).map(k => `"${k}"`).join(', ');
        const values = Object.keys(doc).map(k => sanitize(doc[k])).join(', ');
        sql += `INSERT INTO ${collName} (${columns}) VALUES (${values});\n`;
      }
      
      sql += '\n\n';
    } catch (e) {
      console.error(`Error exporting ${collName}:`, e.message);
    }
  }
  
  fs.writeFileSync('firebase_backup.sql', sql);
  console.log('Backup complete: firebase_backup.sql');
  process.exit(0);
}

exportToSQL();
