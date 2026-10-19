# Snapbook Studio

[![Live Demo](https://img.shields.io/badge/Demo-snapbook--studio.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://snapbook-studio.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-23272f?style=for-the-badge&logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **Sistem Reservasi & Portofolio Studio Foto Profesional** bergaya *architectural editorial luxury*. Dilengkapi mesin booking 5-langkah bergaransi transaksi atomik bebas tabrakan jadwal, pelacakan mandiri e-receipt untuk klien, dan integrasi WhatsApp otomatis.

🌐 **Live Demo Website:** [https://snapbook-studio.vercel.app](https://snapbook-studio.vercel.app)

---

## 📸 Pratinjau Tampilan Sistem

### 1. Landing Page & Editorial Atelier
Tampilan beranda bergaya rumah mode mewah (*high-fashion atelier*) dengan tipografi Playfair Display & Plus Jakarta Sans, pita marquee berjalan kontinu, dan pengubah tone pencahayaan interaktif (*interactive tone switcher*).

![Snapbook Studio Landing Page](docs/images/preview-home.png)

---

### 2. Galeri Karya & Katalog Tarif Transparan
Galeri pameran kurasi dengan filter kategori dinamis, *interactive exhibition lightbox*, dan kartu paket foto transparan berformat Rupiah tanpa biaya tersembunyi.

![Galeri Karya & Paket Foto](docs/images/preview-gallery.png)

---

### 3. Alur Booking 5-Langkah (Anti-Collision Engine)
Wizard reservasi mandiri interaktif dengan pemilihan tanggal kalender dan pengecekan ketersediaan slot waktu secara *real-time*. Jam yang telah terisi otomatis terkunci (*disabled*) demi kenyamanan klien.

![Alur Booking Interaktif](docs/images/preview-booking.png)

---

### 4. Pelacakan Mandiri & E-Receipt Klien (`/cek-booking`)
Halaman pelacakan status jadwal (*Pending*, *Terkonfirmasi*, *Selesai*) dengan kode booking dan nomor WhatsApp pemesan, dilengkapi rincian biaya, alamat studio, dan panduan kedatangan.

![Pelacakan Booking Mandiri](docs/images/preview-cek-booking.png)

---

### 5. Portal Manajemen Admin (`/admin`)
Pusat kontrol operasional studio terproteksi cookie sesi HTTP-only dan enkripsi password `bcrypt` untuk mengelola seluruh data booking, ketersediaan slot, upload galeri, dan konfigurasi studio.

![Portal Admin Snapbook](docs/images/preview-admin.png)

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan arsitektur modern berbasis performa tinggi, keamanan teruji, dan estetika premium:

| Komponen | Teknologi | Keterangan & Peran |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | React Server Components, Server Actions, Route Handlers, dan image optimization native. |
| **UI Library** | [React 19](https://react.dev/) | Rendering performan dengan arsitektur hooks modern. |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type-safe end-to-end dari skema database hingga komponen antarmuka. |
| **Database / ORM** | [Prisma ORM v6](https://www.prisma.io/) & PostgreSQL | Supabase / Neon compatible. Dilengkapi skema relasional terstruktur dan transaksi atomik. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Engine styling `@tailwindcss/postcss` generasi terbaru berbasis CSS variables dinamis. |
| **Ikonografi & Font** | [Lucide React](https://lucide.dev/), Google Fonts | Koleksi ikon konsisten, font Google Playfair Display & Plus Jakarta Sans. |
| **Autentikasi Admin** | Custom Session & [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Signature token berbasis HMAC-SHA256 (`HttpOnly`, `SameSite=Lax`, `Secure` di production). |
| **Hosting & Deploy** | [Vercel](https://vercel.com/) | Deployment otomatis dengan zero-config edge routing dan integrasi environment variables. |

---

## 🔒 Mekanisme Pencegahan Tabrakan Jadwal (Race-Condition Safe)

Pada sistem reservasi fotografi, risiko dua pelanggan memesan jam dan tanggal yang sama secara simultan (*double booking*) adalah celah kritis.

Snapbook Studio menyelesaikan masalah ini di tingkat database melalui **Prisma Interactive Transactions** (`prisma.$transaction`):
1. **Pengecekan Ketersediaan:** Saat request `POST /api/bookings` diterima, transaksi atomik langsung mengunci baris kueri untuk memeriksa bentrok slot waktu (`tx.booking.findFirst`).
2. **Kondisi Validasi:** Jika slot pada tanggal dan jam tersebut sudah terisi dengan status aktif (`PENDING` atau `CONFIRMED`), transaksi langsung dihentikan (*abort & rollback*) dan melempar galat `SLOT_COLLISION` yang menghasilkan HTTP `409 Conflict`.
3. **Pencatatan Atomik:** Pembuatan record booking (`tx.booking.create`) dan kode unik booking hanya dieksekusi jika slot benar-benar kosong, memastikan tidak ada dua pemesanan yang bertabrakan meskipun dikirim dalam milidetik yang identik.

---

## 📋 Prasyarat Sistem

Sebelum menjalankan project di lingkungan lokal, pastikan perangkat Anda telah memenuhi prasyarat berikut:

* **Node.js:** Versi `24.x` (sesuai runtime produksi Vercel)
* **Package Manager:** `npm` (versi 9 ke atas)
* **Database:** PostgreSQL aktif (lokal atau cloud provider seperti [Supabase](https://supabase.com/) / [Neon](https://neon.tech/))

---

## ⚙️ Variabel Lingkungan (.env)

Salin berkas contoh konfigurasi lingkungan:

```bash
cp .env.example .env
```

Berikut adalah daftar variabel lingkungan yang diperlukan:

| Variabel | Deskripsi | Contoh Nilai |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL dengan connection pooling (Port 6543 / PgBouncer / Transaction Mode) untuk Prisma Client aplikasi saat runtime. | `postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Connection string PostgreSQL langsung / unpooled (Port 5432) yang wajib digunakan oleh Prisma CLI untuk migrasi skema (`prisma db push`, `prisma migrate`). | `postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `APP_URL` | URL basis aplikasi untuk pembuatan tautan e-receipt dan pengalihan pesan WhatsApp. | `http://localhost:3000` *(Lokal)* atau `https://snapbook-studio.vercel.app` *(Prod)* |
| `SESSION_SECRET` | Kunci rahasia minimal 32 karakter untuk mengenkripsi dan menandatangani signature cookie sesi login admin via HMAC-SHA256. | `a8f93c048b29f71c4d92a019842c38d9` |
| `ADMIN_USERNAME` | *(Opsional)* Username akun administrator default untuk skrip seeder database (`prisma/seed.ts`). Default: `admin`. | `admin` |
| `ADMIN_PASSWORD` | Wajib saat seed pertama: password unik minimal 12 karakter. Seed tidak mengubah akun yang sudah ada. | Isi secret pribadi |

---

## 🚀 Panduan Menjalankan Project (Lokal)

Ikuti langkah-langkah berikut untuk memulai instalasi lokal:

```bash
# 1. Clone repository
git clone https://github.com/rmdniiagung/snapbook-studio.git
cd snapbook-studio

# 2. Pasang seluruh dependensi (otomatis menjalankan 'prisma generate' via postinstall)
npm install

# 3. Konfigurasi Environment Variables
cp .env.example .env
# Buka berkas .env dan sesuaikan kredensial database Anda

# 4. Sinkronisasi skema database & masukkan data awal
npx prisma db push
npm run seed

# 5. Jalankan server pengembangan
npm run dev
```

Buka peramban Anda di: **`http://localhost:3000`**

### 🔑 Kredensial Admin (Ditetapkan Pemilik)
* **URL Login:** `http://localhost:3000/admin/login`
* **Username:** `admin` *(atau nilai dari `ADMIN_USERNAME` di `.env`)*
* **Password:** Nilai ADMIN_PASSWORD yang Anda tetapkan saat seed pertama.

> [!WARNING]
> **Peringatan Keamanan Produksi:**
> Tetapkan ADMIN_USERNAME dan ADMIN_PASSWORD unik minimal 12 karakter sebelum seed. Seed tidak mereset akun yang sudah ada. Ubah password melalui Pengaturan Studio; perubahan password mencabut sesi lama.

---

## 📜 Daftar Skrip npm

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan Next.js lokal pada port 3000 (`next dev --port 3000`). |
| `npm run build` | Melakukan kompilasi, optimalisasi aset, dan build produksi aplikasi (`next build`). |
| `npm run postinstall` | Menghasilkan TypeScript client Prisma secara otomatis setelah dependensi diinstal (`prisma generate`). |
| `npm run start` | Menjalankan aplikasi dalam mode produksi yang telah di-build (`next start`). |
| `npm run seed` | Menjalankan skrip seeder database (`prisma/seed.ts`) untuk membuat akun admin dari env, paket studio, dan koleksi foto awal. |
| `npm run screenshots` | Mengambil tangkapan layar otomatis seluruh modul utama menggunakan Playwright Chromium (1440x900) dan mengompresnya di bawah 500 KB ke `docs/images/`. |
| `npm run lint` | Menjalankan pengecekan tipe statis TypeScript tanpa mengekstrak berkas output (`tsc --noEmit`). |
| `npx tsx scripts/test-db-connection.ts` | Menguji konektivitas database PostgreSQL/Supabase secara langsung melalui terminal. |
| `npx tsx scripts/verify-admin.ts` | Memeriksa dan mereset kredensial akun administrator langsung pada database via CLI. |

---

## 📁 Struktur Direktori

```text
snapbook-studio/
├── docs/
│   └── images/                # Tangkapan layar antarmuka sistem terkompresi (< 500 KB)
├── prisma/
│   ├── schema.prisma          # Definisi skema basis data PostgreSQL & model relasional
│   └── seed.ts                # Seeder akun admin (via env), paket foto, dan galeri awal
├── public/                    # Aset statis publik (favicon, logo, placeholder gambar)
├── scripts/
│   ├── screenshots.mjs        # Skrip otomatisasi Playwright untuk pembuatan pratinjau sistem
│   ├── test-db-connection.ts  # Skrip utilitas CLI pengujian konektivitas PostgreSQL
│   └── verify-admin.ts        # Skrip utilitas verifikasi dan reset password admin
├── src/
│   ├── app/                   # App Router Next.js (halaman publik, flow booking, & portal admin)
│   │   ├── admin/             # Portal operasional studio (dashboard, bookings, galeri, login)
│   │   ├── api/               # Endpoint REST API (bookings, authentication, upload)
│   │   ├── book/              # Alur wizard reservasi 5-langkah
│   │   ├── cek-booking/       # Modul pelacakan mandiri e-receipt klien
│   │   ├── layout.tsx         # Root layout dan konfigurasi metadata global
│   │   └── page.tsx           # Halaman utama landing page studio
│   ├── components/            # Komponen UI modular (navigation, calendar, modals, toast)
│   └── lib/                   # Utilitas sistem, koneksi Prisma Client tunggal, & auth session
├── .env.example               # Template variabel lingkungan
├── package.json               # Konfigurasi dependensi dan skrip proyek
├── tsconfig.json              # Konfigurasi compiler TypeScript
└── README.md                  # Dokumentasi teknis proyek
```

---

## 🌐 Panduan Deployment (Vercel)

Aplikasi Snapbook Studio dirancang untuk berjalan optimal di platform **Vercel**:

1. **Push ke GitHub:** Pastikan seluruh perubahan kode telah tersimpan di repository GitHub Anda.
2. **Import Project di Vercel:** Masuk ke dashboard [Vercel](https://vercel.com/), pilih **Add New Project**, lalu import repository project ini.
3. **Pengaturan Framework:** Vercel secara otomatis mendeteksi **Next.js**.
4. **Isi Environment Variables:** Masukkan keempat variabel wajib di menu *Environment Variables* Vercel:
   - `DATABASE_URL`: Connection string PostgreSQL (gunakan pooler port 6543 dari Supabase).
   - `DIRECT_URL`: Connection string direct PostgreSQL (port 5432).
   - `APP_URL`: Domain produksi Anda (misal `https://snapbook-studio.vercel.app`).
   - `SESSION_SECRET`: Kunci rahasia minimal 32 karakter untuk sesi admin.
5. **Deploy:** Klik tombol **Deploy**. Skrip `postinstall` akan otomatis men-generate Prisma Client sebelum proses `next build` berjalan.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT License** - lihat berkas [LICENSE](LICENSE) untuk detail lengkap.

---

## 👤 Pengembang & Kontak

* **Author:** **rmdniiagung**
* **Repository:** [https://github.com/rmdniiagung/snapbook-studio](https://github.com/rmdniiagung/snapbook-studio)
* **Live Site:** [https://snapbook-studio.vercel.app](https://snapbook-studio.vercel.app)
* **Copyright:** &copy; 2026 Snapbook Studio by rmdniiagung. All rights reserved.

## Perbaikan keamanan dan performa (19 Oktober 2026)

Runtime Node.js 24.x. Jalankan `npm test`, `npm run lint`, dan `npm run build` untuk verifikasi. Skema hardening untuk database baru ada di `prisma/hardening.sql`; `prisma db push` saja tidak mengatur RLS/grant. Produksi sudah dimigrasikan, jangan mengulang seed di produksi.

Katalog di-cache 60 detik dan diperbarui saat admin menyimpan perubahan. Ketersediaan booking tetap dibaca langsung. API daftar booking kini memakai envelope pagination (25 baris, maksimal 50), dan tracking memerlukan kode serta nomor WhatsApp.

Upload galeri memakai Vercel Blob yang ditautkan ke proyek. Konfigurasi server ditambahkan otomatis saat store dihubungkan; jangan beri awalan NEXT_PUBLIC_. Supabase Storage tersedia sebagai alternatif dengan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY dan bucket publik studio-gallery. Upload JPEG/PNG/WebP maksimal 4 MiB; URL HTTPS juga tersedia.

Skrip uji lama kini menjalankan regresi mock tanpa mengubah database. Screenshot admin memerlukan SCREENSHOT_ADMIN_USERNAME dan SCREENSHOT_ADMIN_PASSWORD; tanpa itu hanya halaman login yang diambil.

Catatan eksekusi dan keterbatasan: `docs/audits/2026-10-19/IMPLEMENTATION.md`.
