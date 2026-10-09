# Spesifikasi Desain: Rombak Total Sistem Snapbook Studio

- **Tanggal:** 2026-10-09
- **Status:** Disetujui (Approved)
- **Arsitektur:** Next.js (App Router) Full-Stack + TypeScript + Tailwind CSS + SQLite + Prisma ORM

---

## 1. Latar Belakang & Tujuan
Sistem Snapbook Studio sebelumnya berbasis Vite SPA dengan satu file monolitik (`App.tsx`, 2.500+ baris) yang menggabungkan landing page, booking wizard, logic admin, dan state management lokal dalam satu tempat.
Pengguna meminta perombakan total dari awal (*overhaul from scratch*) untuk memigrasikan sistem ke arsitektur full-stack modern yang bersih, cepat, modular, dan memiliki database relasional mandiri (*zero-config*) dengan proteksi bentrok jadwal reservasi.

---

## 2. Arsitektur Teknologi

| Komponen | Pilihan Teknologi | Rincian / Alasan |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | Server-side rendering (SSR), struktur modular, Route Handlers & Server Actions |
| **Bahasa** | TypeScript | Type safety penuh dari database schema hingga komponen UI |
| **Styling** | Tailwind CSS | Utility-first styling modern, responsif, dan ringan |
| **Icons** | Lucide React | Koleksi icon bersih dan konsisten |
| **Database & ORM** | SQLite + Prisma ORM | Zero-config lokal (`prisma/dev.db`), skema relasional terstruktur, siap upgrade ke PostgreSQL |
| **Autentikasi Admin** | HTTP-Only Session Cookie | Aman terhadap XSS, signed session token tanpa bloat dependency eksternal |
| **Integrasi Eksternal**| WhatsApp Direct API (`https://wa.me/...`) | Format pesan reservasi otomatis dengan rincian biaya & kode booking |

---

## 3. Struktur Direktori Proyek

```text
├── prisma/
│   ├── schema.prisma                  # Skema database relasional
│   └── seed.ts                        # Script pengisian data awal studio
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout dengan font & meta tag
│   │   ├── page.tsx                   # Landing page publik (Hero, Portofolio, Layanan, Kontak)
│   │   ├── book/
│   │   │   └── page.tsx               # Halaman mandiri Booking Wizard interaktif
│   │   ├── admin/
│   │   │   ├── login/page.tsx         # Halaman login administrator
│   │   │   ├── layout.tsx             # Layout admin dengan sidebar & guard autentikasi
│   │   │   ├── page.tsx               # Dashboard overview & metrik statistik
│   │   │   ├── bookings/page.tsx      # Manajemen status reservasi & filter
│   │   │   ├── packages/page.tsx      # CRUD paket foto & add-ons
│   │   │   ├── gallery/page.tsx       # Kelola foto showcase portofolio
│   │   │   └── settings/page.tsx      # Pengaturan jam operasional & profil studio
│   │   └── api/
│   │       ├── auth/                  # Route handlers login, logout, & check session
│   │       ├── bookings/              # Route handlers booking & cek ketersediaan slot
│   │       ├── packages/              # Route handlers paket foto
│   │       ├── gallery/               # Route handlers foto showcase
│   │       └── settings/              # Route handlers konfigurasi studio
│   ├── components/
│   │   ├── ui/                        # Komponen atomik: Button, Input, Modal, Badge, Card
│   │   ├── landing/                   # Komponen publik: Navbar, Hero, Services, Gallery, About, Footer
│   │   ├── booking/                   # Komponen alur: StepPackage, StepDateTime, StepAddOns, StepClientInfo, StepConfirmation
│   │   └── admin/                     # Komponen admin: Sidebar, StatsCard, BookingTable, PackageModal
│   └── lib/
│       ├── prisma.ts                  # Prisma Client singleton
│       ├── auth.ts                    # Utility verifikasi sesi & password hash
│       ├── whatsapp.ts                # Generator teks dan URL WhatsApp
│       └── utils.ts                   # Formatting mata uang IDR & date helper
```

---

## 4. Skema Database (Prisma Schema)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model StudioConfig {
  id             String   @id @default("default")
  studioName     String   @default("Snapbook Studio")
  whatsappNumber String   @default("6281234567890")
  instagramHandle String  @default("@snapbookstudio")
  openingTime    String   @default("09:00") // Format HH:mm
  closingTime    String   @default("20:00") // Format HH:mm
  slotDuration   Int      @default(60)      // Dalam menit
  address        String   @default("Jl. Studio Foto No. 10, Jakarta")
  aboutText      String   @default("Studio foto profesional untuk mengabadikan momen berharga Anda.")
  updatedAt      DateTime @updatedAt
}

model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Package {
  id          String         @id @default(cuid())
  name        String
  description String
  price       Int
  duration    Int            // Durasi sesi dalam menit
  category    String         // Portrait, Graduation, Family, Couple, dll.
  imageUrl    String?
  features    String         // JSON string list fitur
  isActive    Boolean        @default(true)
  sortOrder   Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  bookings    Booking[]
}

model AddOn {
  id          String         @id @default(cuid())
  name        String
  price       Int
  description String?
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  bookingAddOns BookingAddOn[]
}

model Booking {
  id          String         @id @default(cuid())
  bookingCode String         @unique // Format: SB-YYYYMMDD-XXXX
  packageId   String
  package     Package        @relation(fields: [packageId], references: [id])
  clientName  String
  clientEmail String
  clientPhone String
  date        String         // Format: YYYY-MM-DD
  startTime   String         // Format: HH:mm
  endTime     String         // Format: HH:mm
  status      String         @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
  totalPrice  Int
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  addOns      BookingAddOn[]
}

model BookingAddOn {
  id             String   @id @default(cuid())
  bookingId      String
  booking        Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addOnId        String
  addOn          AddOn    @relation(fields: [addOnId], references: [id])
  priceAtBooking Int
}

model ShowcaseImage {
  id          String   @id @default(cuid())
  url         String
  title       String?
  category    String   @default("General")
  aspectRatio String   @default("portrait") // portrait, landscape, square
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

## 5. Alur Pemesanan Klien (Booking Flow)

1. **Pilih Paket:** Klien memilih paket dari daftar paket aktif dengan preview harga dan fitur.
2. **Pilih Tanggal & Jam:**
   - Kalender dinamis membatasi tanggal (hanya tanggal sekarang ke depan).
   - Sistem melakukan query ke database mencari booking pada tanggal tersebut dengan status `PENDING` atau `CONFIRMED`.
   - Jam yang bentrok otomatis berstatus *Disabled* / tidak dapat dipilih.
3. **Pilih Layanan Tambahan (Add-ons):** Opsi opsional seperti ekstra cetak atau makeup, dengan kalkulasi harga subtotal real-time.
4. **Data Klien:** Input Nama Lengkap, Nomor WhatsApp, Email, dan Catatan.
5. **Konfirmasi & WhatsApp:**
   - Sistem membuat reservasi secara atomik di database (status `PENDING`).
   - Kode booking acak unik dihasilkan (misal `SB-20261009-9182`).
   - Tombol *"Kirim Konfirmasi WhatsApp"* membuka tautan:
     ```text
     https://wa.me/{studioConfig.whatsappNumber}?text=Halo%20Snapbook%20Studio...
     ```

---

## 6. Portal Administrasi & Keamanan

* **Proteksi Rute:** Middleware / Session Guard memeriksa HTTP-only cookie. Tanpa cookie yang valid, dialihkan ke `/admin/login`.
* **Kredensial Bawaan Seeding:**
  - Username: `admin`
  - Password: `adminpassword123` (diberi opsi ubah password di pengaturan)
* **Manajemen Reservasi:**
  - Filter status: *Semua, Pending, Confirmed, Completed, Cancelled*.
  - Aksi instan: Update status dan tautan langsung untuk mengirim pesan WhatsApp ke klien.
* **Manajemen Konten:**
  - Tambah/edit paket foto & Add-on.
  - Tambah/hapus foto galeri portofolio.
  - Ubah informasi studio (jam buka/tutup, nomor WhatsApp, alamat).

---

## 7. Rencana Pengujian & Verifikasi
- **Self-Check Test Script:** Script mandiri yang dapat dijalankan langsung (`scripts/verify-system.ts`):
  1. Memverifikasi konektivitas Prisma & seeding data.
  2. Menguji pencegahan bentrok jadwal (mencegah pembuatan dua booking pada tanggal & jam yang sama).
  3. Menguji kalkulasi total harga (paket + add-ons) dan format tautan WhatsApp.
  4. Menguji utilitas autentikasi admin.
