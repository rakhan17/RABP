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
  { username: 'uptd jj', password: 'DPU07', role: 'viewer', bidang: 'UPTD Jalan dan Jembatan' },
  { username: 'bidang gp', password: 'DPU08', role: 'viewer', bidang: 'Bidang Gedung Pemerintah' }
];

export const BINDANG_LIST = [
  'Keuangan',
  'Bidang Sekretariat',
  'Bidang Jalan dan Jembatan',
  'Bidang Sumber Daya Air',
  'Bidang Penyehatan Lingkungan Permukiman',
  'UPTD Drainase dan Bozem',
  'UPTD Jalan dan Jembatan',
  'Bidang Gedung Pemerintah'
];

export const SUB_KEGIATAN_LIST = [
  '1.03.01.2.01.0001',
  '1.03.01.2.02.0001',
  '1.03.01.2.05.0009',
  '1.03.01.2.06.0001',
  '1.03.01.2.06.0004',
  '1.03.01.2.06.0005',
  '1.03.01.2.06.0008',
  '1.03.01.2.06.0009',
  '1.03.01.2.06.0010',
  '1.03.01.2.07.0002',
  '1.03.01.2.08.0002',
  '1.03.01.2.08.0004',
  '1.03.01.2.09.0001',
  '1.03.01.2.09.0002',
  '1.03.01.2.09.0006',
  '1.03.01.2.09.0009',
  '1.03.01.2.09.0010',
  '1.03.02.2.01.0093',
  '1.03.02.2.01.0128',
  '1.03.02.2.02.0002',
  '1.03.03.2.01.0031',
  '1.03.03.2.01.0032',
  '1.03.05.2.01.0022',
  '1.03.05.2.01.0032',
  '1.03.05.2.01.0040',
  '1.03.05.2.01.0044',
  '1.03.05.2.01.0045',
  '1.03.06.2.01.0012',
  '1.03.06.2.01.0021',
  '1.03.06.2.01.0024',
  '1.03.06.2.01.0028',
  '1.03.06.2.01.0029',
  '1.03.08.2.01.0017',
  '1.03.08.2.01.0021',
  '1.03.08.2.01.0023',
  '1.03.10.2.01.0029',
  '1.03.10.2.01.0053',
  '1.03.10.2.01.0055',
  '1.03.10.2.01.0056',
  '1.03.10.2.01.0059',
  '1.03.10.2.01.0060',
  '1.03.10.2.01.0068',
  '1.03.10.2.01.0069',
  '1.03.11.2.01.0011',
  '1.03.11.2.01.0016',
  '1.03.11.2.02.0013',
  '1.03.02.2.01.0082',
  '1.03.06.2.01.0031',
  '1.03.10.2.01.0051',
  '1.03.10.2.01.0067',
];

export async function getUserByUsername(username: string): Promise<User | null> {
  const normalizedUsername = username.toLowerCase().trim();
  const user = USERS.find(u => u.username.toLowerCase() === normalizedUsername);
  return user || null;
}
