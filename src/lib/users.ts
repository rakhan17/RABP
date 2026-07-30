export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'viewer';
  bidang: string;
}

export const USERS: User[] = [
  { username: 'keuangan', password: 'DPU01', role: 'admin', bidang: 'Keuangan' },
  { username: 'sekretariat', password: 'DPU02', role: 'viewer', bidang: 'Bidang Sekretariat' },
  { username: 'bidang jj', password: 'DPU03', role: 'viewer', bidang: 'Bidang Jalan dan Jembatan' },
  { username: 'bidang sda', password: 'DPU04', role: 'viewer', bidang: 'Bidang Sumber Daya Air' },
  { username: 'bidang plp', password: 'DPU05', role: 'viewer', bidang: 'Bidang Penyehatan Lingkungan Permukiman' },
  { username: 'uptd drainase', password: 'DPU06', role: 'viewer', bidang: 'UPTD Drainase dan Bozem' },
  { username: 'uptd jj', password: 'DPU07', role: 'viewer', bidang: 'UPTD Jalan dan Jembatan' }
];

export const BINDANG_LIST = [
  'Keuangan',
  'Bidang Sekretariat',
  'Bidang Jalan dan Jembatan',
  'Bidang Sumber Daya Air',
  'Bidang Penyehatan Lingkungan Permukiman',
  'UPTD Drainase dan Bozem',
  'UPTD Jalan dan Jembatan'
];

export async function getUserByUsername(username: string): Promise<User | null> {
  const normalizedUsername = username.toLowerCase().trim();
  const user = USERS.find(u => u.username.toLowerCase() === normalizedUsername);
  return user || null;
}
