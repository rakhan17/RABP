import { createClient } from '@supabase/supabase-js';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://rdwpjrwvtimwlmdkhzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3Bqcnd2dGltd2xtZGtoend2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTk1NDcsImV4cCI6MjEwMzA5NTU0N30.DAZHlTomb5xdTphisnvTSAlAkp-nqG6cC-lH_ydspT4';
const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
  { username: 'keuangan', password: 'DPU01', role: 'admin', bidang: 'Keuangan' },
  { username: 'sekretariat', password: 'DPU02', role: 'viewer', bidang: 'Bidang Sekretariat' },
  { username: 'bidang jj', password: 'DPU03', role: 'viewer', bidang: 'Bidang Jalan dan Jembatan' },
  { username: 'bidang sda', password: 'DPU04', role: 'viewer', bidang: 'Bidang Sumber Daya Air' },
  { username: 'bidang plp', password: 'DPU05', role: 'viewer', bidang: 'Bidang Penyehatan Lingkungan Permukiman' },
  { username: 'uptd drainase', password: 'DPU06', role: 'viewer', bidang: 'UPTD Drainase dan Bozem' },
  { username: 'uptd jj', password: 'DPU07', role: 'viewer', bidang: 'UPTD Jalan dan Jembatan' },
  { username: 'bidang gp', password: 'DPU08', role: 'viewer', bidang: 'Bidang Gedung Pemerintah' }
];

async function seed() {
  for (const user of USERS) {
    const email = `${user.username.replace(/\s+/g, '_')}@rabp.local`;
    console.log(`Signing up ${email}...`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: user.password + '_', // Pad to 6 chars
      options: {
        data: {
          username: user.username,
          role: user.role,
          bidang: user.bidang
        }
      }
    });

    if (error) {
      console.error(`Error for ${user.username}:`, error.message);
    } else {
      console.log(`Success for ${user.username}!`);
    }
  }
}

seed();
