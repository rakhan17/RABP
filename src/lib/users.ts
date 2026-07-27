export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'viewer';
  bidang: string;
}

export const USERS: User[] = [
  { username: 'Keuangan', password: 'DPU01', role: 'admin', bidang: 'Keuangan' },
  { username: 'Sekretariat', password: 'DPU02', role: 'viewer', bidang: 'Sekretariat' },
  { username: 'Bidang JJ', password: 'DPU03', role: 'viewer', bidang: 'Bidang JJ' },
  { username: 'Bidang SDA', password: 'DPU04', role: 'viewer', bidang: 'Bidang SDA' },
  { username: 'Bidang PLP', password: 'DPU05', role: 'viewer', bidang: 'Bidang PLP' },
  { username: 'Bidang GP', password: 'DPU06', role: 'viewer', bidang: 'Bidang GP' },
  { username: 'UPTD Drainase', password: 'DPU07', role: 'viewer', bidang: 'UPTD Drainase' },
  { username: 'UPTD JJ', password: 'DPU08', role: 'viewer', bidang: 'UPTD JJ' },
];
