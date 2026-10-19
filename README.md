# Snapbook Studio

Aplikasi booking untuk studio foto. Pelanggan bisa memilih paket dan jadwal sendiri, sementara admin mengelola reservasi, kalender, dan catatan pembayaran.

[Coba aplikasi](https://snapbook-studio.vercel.app)

## Video demo

https://github.com/user-attachments/assets/ef501ecc-4964-4496-8ee4-045a8d4ad307

[Unduh video MP4](docs/videos/snapbook-promo.mp4)

## Fitur

- Booking paket, layanan tambahan, tanggal, dan jam yang tersedia.
- Cek status booking dengan kode reservasi dan nomor WhatsApp.
- Kalender admin harian/mingguan, pindah jadwal, blok waktu, dan jeda antarsesi.
- Kelola paket, galeri foto, profil studio, serta catatan DP dan pengembalian uang.

Konfirmasi WhatsApp dibuka melalui tautan. Pencatatan pembayaran dan pembatalan booking dilakukan manual oleh admin.

## Menjalankan lokal

Gunakan Node.js 24 dan database PostgreSQL yang sudah disiapkan.

```bash
git clone https://github.com/agungrmdniiii/Snapbook-Studio.git
cd Snapbook-Studio
npm ci
cp .env.example .env
```

Isi `DATABASE_URL`, `DIRECT_URL`, `APP_URL`, dan `SESSION_SECRET` di `.env`. Gunakan secret acak minimal 32 karakter. Lihat [.env.example](.env.example) untuk formatnya.

Struktur database ada di [schema.prisma](prisma/schema.prisma). Database juga memerlukan aturan akses dan trigger pada [hardening.sql](prisma/hardening.sql) serta [operations.sql](prisma/operations.sql). `prisma db push` saja belum memasang seluruh pengaman; berkas SQL tersebut bukan skrip yang boleh dijalankan ulang sembarangan pada database yang sudah terisi.

Untuk database baru, isi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` sebelum menjalankan `npm run seed`. Password minimal 12 karakter. Seed menambahkan akun dan data awal, tanpa mereset akun yang sudah ada.

```bash
npm run dev
```

Buka [localhost:3000](http://localhost:3000). Login admin tersedia di `/admin/login` dengan akun yang dibuat saat seed.

## Pemeriksaan

```bash
npm test
npm run lint
npm run build
```

`lint` memeriksa tipe TypeScript. Pengujian alur database nyata dijelaskan di [catatan pengujian](docs/audits/2026-10-19/database-mutations/README.md).

## Deployment

Proyek memakai Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, dan PostgreSQL di Supabase. Hosting produksi menggunakan Vercel.

Hubungkan repository ke Vercel dan atur variabel lingkungan sesuai `.env.example`. Upload foto memakai Vercel Blob; foto juga bisa ditambahkan melalui URL HTTPS.

## Lisensi

[MIT](LICENSE).
