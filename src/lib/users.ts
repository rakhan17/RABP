export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'viewer';
  bidang: string;
}

export const USERS: User[] = [
  { username: 'Keuangan', password: 'DPU01', role: 'admin', bidang: 'Keuangan' },
  { username: 'Sekretariat', password: 'DPU02', role: 'viewer', bidang: 'Sekretariat' },
  { username: 'Bidang JJ', password: 'DPU03', role: 'viewer', bidang: 'UPTD Jalan dan Jembatan' },
  { username: 'Bidang SDA', password: 'DPU04', role: 'viewer', bidang: 'UPTD Drainase dan Bozem' },
  { username: 'Bidang GP', password: 'DPU05', role: 'viewer', bidang: 'Bidang Gedung Pemerintahan' },
  { username: 'Bidang AM', password: 'DPU06', role: 'viewer', bidang: 'Bidang Air Minum' },
  { username: 'Bidang PLP', password: 'DPU07', role: 'viewer', bidang: 'Bidang Penyehatan Lingkungan Permukiman' },
  { username: 'Bidang PR', password: 'DPU08', role: 'viewer', bidang: 'Bidang Penataan Ruang' }
];

export const BINDANG_LIST = [
  'Keuangan',
  'Sekretariat',
  'UPTD Jalan dan Jembatan',
  'UPTD Drainase dan Bozem',
  'Bidang Gedung Pemerintahan',
  'Bidang Air Minum',
  'Bidang Penyehatan Lingkungan Permukiman',
  'Bidang Penataan Ruang'
];

export async function getUserByUsername(username: string): Promise<User | null> {
  const normalizedUsername = username.toLowerCase();
  const user = USERS.find(u => u.username.toLowerCase() === normalizedUsername);
  return user || null;
}
