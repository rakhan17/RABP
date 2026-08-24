# Blueprint & Arsitektur Aplikasi RABP

Dokumen ini berfungsi sebagai panduan (blueprint) bagi *Agent AI* maupun *Developer* manusia untuk memahami struktur, cara kerja, dan aturan main (konvensi) dalam aplikasi **RABP (Rekapitulasi Aliran Barang dan Pembayaran)**.

---

## 1. Overview Sistem
RABP adalah aplikasi web internal berbasis *Single Page Application* (SPA) untuk mencatat, mengelola, dan merekapitulasi data keuangan (SPP, SPM, dan SP2D).
Aplikasi ini memiliki fitur *spreadsheet* (seperti Excel) untuk *data entry* yang tersinkronisasi secara *realtime* ke *database*.

### Tech Stack:
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide React (Icons)
- **Database:** Firebase Firestore (NoSQL)
- **Data Entry UI:** `@fortune-sheet/react` (Library Spreadsheet)
- **Routing:** React Router DOM

---

## 2. Struktur Direktori Utama

```
/Applications/Mind/RABP/
├── src/
│   ├── components/       # Komponen UI Reusable (Layout, Sidebar, SpreadsheetGrid)
│   ├── contexts/         # React Context untuk State Management Global (Auth, Data)
│   ├── lib/              # Logic dan Service eksternal (Firebase service, Users statis)
│   ├── pages/            # Komponen Halaman (Login, Dashboard, Rekap)
│   ├── types/            # Definisi Interface/Tipe TypeScript
│   ├── App.tsx           # Entry point untuk Routing & Context Providers
│   ├── firebase.ts       # Konfigurasi & Inisialisasi Firebase App
│   └── index.css         # Styling global (termasuk aturan @media print)
```

---

## 3. Konfigurasi & Cara Kerja Penting

### A. Sistem Autentikasi (Login)
- **Sistem:** Lokal statis *(Offline-first Auth)*
- **File:** `src/lib/users.ts` dan `src/contexts/AuthContext.tsx`
- **Cara Kerja:**
  - Aplikasi **TIDAK** menggunakan Firebase Auth / Supabase Auth.
  - Data akun (*Username, Password, Role, Bidang*) di-hardcode dalam array `USERS` di `src/lib/users.ts`.
  - Fungsi login mengecek `username` dengan mode *case-insensitive* (`toLowerCase().trim()`).
  - Sesi login disimpan di `localStorage` (`rabp_user`).

### B. Database & Data Management
- **Sistem:** Firebase Firestore
- **File:** `src/lib/firestoreService.ts` dan `src/contexts/DataContext.tsx`
- **Cara Kerja:**
  - `firestoreService.ts` berisi fungsi abstraksi CRUD ke Firebase (`getDocs`, `addDoc`, `updateDoc`, `deleteDoc`).
  - Terdapat fitur `subscribeToCollection` (menggunakan `onSnapshot`) yang **otomatis menarik data secara *realtime*** jika ada perubahan.
  - `DataContext.tsx` merupakan "Otak Data". Di sini, data SPP, SPM, dan SP2D digabung dan difilter berdasarkan status/jabatan pengguna (*Role/Bidang*).

### C. Antarmuka Data Entry (Spreadsheet)
- **Sistem:** Fortune Sheet
- **File:** `src/components/SpreadsheetGrid.tsx`
- **Cara Kerja:**
  - Merender data dari `DataContext` menjadi tampilan kotak-kotak ala Excel.
  - Saat ada sel (cell) yang diubah oleh user, fungsi `onChange` mendeteksi *row/column* lalu memanggil fungsi *update* dari `firestoreService.ts`.

### D. Rekapitulasi & Cetak PDF (Print)
- **Sistem:** Native Browser Print
- **File:** `src/pages/Recap.tsx` dan `src/components/Layout.tsx`
- **Cara Kerja:**
  - Menggabungkan data SPP, SPM, dan SP2D menggunakan sebuah "Kunci" (*Key*) penggabung berdasarkan `Keterangan` dan `Nama Penerima`.
  - **Cetak (Print):** Memanfaatkan CSS `@media print` untuk menyembunyikan Sidebar dan menghapus batas tinggi (`h-screen`, `overflow-hidden`).
  - **ATURAN PENTING CETAK PDF:** Komponen terluar (di `Layout.tsx` dan `Recap.tsx`) menggunakan utilitas Tailwind `print:h-auto print:overflow-visible print:block` agar tabel panjang bisa menyeberang/berpindah ke halaman berikutnya saat di-print ke PDF.

### E. Penanganan Format Tanggal
- Format tanggal di dalam database *bukan* format ISO standar, melainkan **String Bahasa Indonesia** (contoh: `"30 Januari 2026"`).
- Jika *Agent* / *Developer* perlu membuat fitur Filter Tanggal (Start Date - End Date), wajib menggunakan fungsi utilitas parsing (*custom parser*) seperti `parseIndoDate(dateStr)` yang mengonversi nama bulan bahasa Indonesia ke indeks bulan agar bisa dibandingkan dengan objek `Date`.

---

## 4. 🛑 Aturan / Larangan untuk AI Agent (Developer Guidelines)

1. **JANGAN GUNAKAN SUPABASE:** Aplikasi ini menggunakan Firebase Firestore. Rencana migrasi ke Supabase pernah dilakukan namun **DIBATALKAN (ROLLED BACK)**. Jangan berusaha menginstall ulang `supabase-js`.
2. **Autentikasi Lokal:** Jangan sentuh sistem otentikasi Firebase atau layanan Cloud lainnya, aplikasi ini dikonfigurasi untuk hanya membaca array `USERS` secara lokal untuk alasan kepraktisan instansi.
3. **Konvensi ID Elemen (A11y/Testing):** Usahakan selalu menyertakan atribut ARIA dan struktur tabel semantik (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`) saat membangun UI tabel kustom di luar Fortune Sheet (seperti pada halaman Rekap) agar struktur cetaknya (Print) sempurna.
4. **TailwindCSS Saja:** Jangan menulis file CSS terpisah kecuali Anda mengubah konfigurasi `@media print` atau mendefinisikan *base variables* di dalam `index.css`. Gunakan `className` utilitas Tailwind.

*(Dokumen ini akan terus diperbarui secara historis mengikuti setiap perkembangan arsitektur aplikasi).*
