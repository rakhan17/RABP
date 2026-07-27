export interface Sp2dRegistration {
  id?: string;
  no: number;
  tglAntarBerkas: string; // ISO String or YYYY-MM-DD
  noSpm: string;
  namaRekanan: string;
  nilaiKwitansi: number;
  bidang: string;
  kodeSubKegiatan: string;
  pekerjaan: string;
  noSp2d: string;
  tglCairSp2d: string; // ISO String or YYYY-MM-DD
  createdAt: number;
}
