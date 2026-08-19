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
  console.log("Starting migration via REST API...");
  for (const user of USERS) {
    const docId = user.username.toLowerCase().replace(/\s+/g, '-');
    const url = `https://firestore.googleapis.com/v1/projects/rabp-473e4/databases/(default)/documents/users/${docId}`;
    
    // Firestore REST API requires specific type formatting
    const body = {
      fields: {
        username: { stringValue: user.username },
        password: { stringValue: user.password },
        role: { stringValue: user.role },
        bidang: { stringValue: user.bidang }
      }
    };

    try {
      const res = await fetch(url, {
        method: 'PATCH', // PATCH creates or updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        console.log(`Successfully migrated user: ${user.username}`);
      } else {
        console.error(`Failed to migrate user ${user.username}:`, await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  }
}

migrate();
