export interface SppData {
  id?: string;
  tanggalSpp: string;
  nomorSpp: string;
  unitSkpd: string;
  namaPenerima: string;
  keterangan: string;
  jenisSpp: string;
  nilaiBruto: number;
  nilaiPotongan: number;
  nilaiNeto: number;
  bidang: string;
  subKegiatan: string;
  createdAt?: string;
}

export interface SpmData {
  id?: string;
  tanggalSpm: string;
  nomorSpm: string;
  unitSkpd: string;
  namaPenerima: string;
  keterangan: string;
  jenisSpm: string;
  nilaiBruto: number;
  nilaiPotongan: number;
  nilaiNeto: number;
  createdAt?: string;
}

export interface Sp2dData {
  id?: string;
  tanggalSp2dPembuatan: string;
  tanggalSp2dPencairan: string;
  nomorSp2d: string;
  unitSkpd: string;
  namaPenerima: string;
  keterangan: string;
  jenisSp2d: string;
  pajakJenis: string;
  pajakNama: string;
  pajakJumlah: number;
  kodeBiling: string;
  nomorNtpn: string;
  createdAt?: string;
}

export interface MergedRekapData {
  // Joined by namaPenerima and keterangan
  id?: string;
  namaPenerima: string;
  keterangan: string;
  
  // SPP Fields
  tanggalSpp: string;
  nomorSpp: string;
  bidang: string;
  subKegiatan: string;
  sppUnitSkpd: string;
  jenisSpp: string;
  
  // SPM Fields
  tanggalSpm: string;
  nomorSpm: string;
  spmUnitSkpd: string;
  jenisSpm: string;
  
  // SP2D Fields
  tanggalSp2dPembuatan: string;
  tanggalSp2dPencairan: string;
  nomorSp2d: string;
  sp2dUnitSkpd: string;
  jenisSp2d: string;
  
  // Financials (usually from SPM or SPP, we can fallback)
  nilaiBruto: number;
  nilaiPotongan: number;
  nilaiNeto: number;
  
  // Tax
  pajakJenis: string;
  pajakNama: string;
  pajakJumlah: number;
  kodeBiling: string;
  nomorNtpn: string;
}
