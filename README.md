# Snapbook Studio - Modern Photo Studio & Booking System

Sistem manajemen dan pemesanan studio foto full-stack modern yang dibangun ulang dari awal (*revamped from scratch*) menggunakan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Prisma ORM** dengan database **SQLite** mandiri (*zero-config*).

---

## ✨ Fitur Utama

### 1. 🌐 Landing Page Publik Bergaya Editorial Modern
- **Hero Showcase:** Visual estetik dengan headline menarik dan nilai unggulan studio.
- **Portofolio Galeri:** Filter foto dinamis (*Portrait, Graduation, Family, Couple*).
- **Katalog Paket & Tarif:** Rincian durasi sesi, fasilitas termasuk, dan harga transparan format Rupiah.
- **FAQ Interaktif:** Tanya jawab seputar jam kedatangan, aturan reschedule, dan pengiriman file softcopy.
- **Profil Studio:** Jam operasional, alamat fisik, nomor WhatsApp, dan akun Instagram.

### 2. 📅 Alur Booking 5 Langkah Interaktif (Anti Double-Booking)
- **Langkah 1 (Pilih Paket):** Kartu perbandingan paket dengan tombol seleksi instan.
- **Langkah 2 (Pilih Tanggal & Jam):** Kalender dinamis dengan query ketersediaan slot real-time. Jam yang telah dipesan otomatis berstatus **"Penuh" / Disabled**, mencegah tabrakan jadwal (*race-condition safe*).
- **Langkah 3 (Add-ons):** Pilihan ekstra layanan (cetak 10R, ekstra retouch, wardrobe) dengan kalkulasi subtotal harga langsung.
- **Langkah 4 (Data Diri):** Form nama, no WhatsApp, email, dan catatan khusus.
- **Langkah 5 (Konfirmasi & WhatsApp):** Pembuatan kode booking unik (misal: `SB-20261009-8472`) dan tombol aksi utama **"Kirim Konfirmasi via WhatsApp"** yang langsung membuka WhatsApp admin studio dengan format pesan terstruktur.

### 3. 🔍 Pelacakan Mandiri untuk Klien (`/cek-booking`)
- Klien dapat memasukkan **Kode Booking** atau **Nomor WhatsApp** mereka kapan saja.
- Menampilkan kartu status real-time (*Menunggu DP*, *Terkonfirmasi*, *Selesai*), rincian sesi, alamat studio, dan panduan kedatangan.

### 4. 🛡️ Portal Administrasi Lengkap (`/admin`)
- **Autentikasi Aman:** Login admin dengan verifikasi hash bcrypt dan cookie sesi HTTP-only (*XSS-safe*).
- **Dashboard Ringkasan:** Statistik total reservasi, pesanan pending, sesi foto hari ini, dan estimasi omset.
- **Kelola Reservasi (`/admin/bookings`):** Filter tab status, pencarian cepat, update status, tombol chat WhatsApp klien, serta tombol **"Reminder H-1"** otomatis via WhatsApp.
- **Kelola Paket & Add-on (`/admin/packages`):** Tambah, edit, aktif/nonaktifkan, dan hapus paket atau add-on.
- **Kelola Galeri (`/admin/gallery`):** Upload foto portofolio baru dan hapus foto lama.
- **Pengaturan Studio (`/admin/settings`):** Konfigurasi nama studio, jam buka-tutup, nomor WhatsApp tujuan booking, alamat, dan ubah password admin.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15.x (App Router)
- **Library:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database & ORM:** SQLite (`prisma/dev.db`) + Prisma ORM
- **Security:** HTTP-only Signed Session Cookies, bcryptjs
- **Icons:** Lucide React

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js versi 18+ (direkomendasikan Node.js 20 atau 22+)
- npm atau pnpm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Sinkronisasi Database SQLite
```bash
npx prisma db push
```

### 4. Isi Data Awal (Seeding)
Mengisi konfigurasi studio default, paket foto default, add-ons, foto galeri, dan akun admin:
```bash
npm run seed
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka peramban di: **`http://localhost:3000`**

---

## 🔑 Kredensial Admin Bawaan

- **URL Login Admin:** `http://localhost:3000/admin/login`
- **Username:** `admin`
- **Password:** `adminpassword123`

*(Password dapat diubah kapan saja melalui menu Pengaturan di dalam portal admin).*

---

## 🧪 Pengujian & Verifikasi Mandiri

Sistem dilengkapi suite pengujian otomatis mandiri:
```bash
npx tsx scripts/verify-all.ts
```
Pengujian ini memverifikasi:
1. Integritas skema dan koneksi database SQLite.
2. Generator slot jam & formatter Rupiah (IDR).
3. Mesin transaksi pencegah bentrok booking (*anti double-booking*).
4. Template dan URL generator WhatsApp.
5. Keamanan hash password dan validasi sesi cookie admin.
