# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Klien Pemesan (Primary):** Individu, wisudawan, pasangan/couple, dan keluarga yang menginginkan sesi foto berkualitas tinggi dengan estetika studio modern, transparansi harga tanpa biaya tersembunyi, dan proses reservasi mandiri yang cepat via smartphone maupun desktop.
- **Pengelola Studio / Admin (Secondary):** Tim manajemen Snapbook Studio yang mengelola jadwal pemotretan harian, verifikasi pemesanan klien, pembaruan katalog paket & harga, kurasi galeri karya, dan pengaturan operasional studio.

## Product Purpose

Menyediakan sistem operasional studio foto digital terintegrasi yang menggabungkan landing page portofolio bergaya editorial dengan alur reservasi mandiri (self-booking wizard) tanpa hambatan, proteksi pencegah bentrok jadwal (anti-double booking concurrency guard), pelacakan status pesanan instan, dan notifikasi otomatis ke WhatsApp studio.

## Positioning

Studio foto editorial minimalis kontemporer di Jakarta Selatan yang mengutamakan pencahayaan presisi, arahan gaya natural, transparansi tarif mutlak, dan otomasi alur pemesanan digital yang rapi, profesional, dan dapat diandalkan.

## Operating Context

- **Klien:** Sebagian besar mengakses melalui smartphone (dari tautan Instagram / media sosial) serta desktop saat merencanakan sesi foto penting (wisuda, keluarga, lookbook).
- **Alur Transaksi:** Klien memilih slot jam, mendapatkan kode reservasi unik (`SB-YYYYMMDD-XXXX`), dan langsung terhubung ke WhatsApp resmi studio untuk konfirmasi akhir.
- **Pelacakan Mandiri:** Klien dapat memeriksa detail booking dan e-receipt studio melalui `/cek-booking`.
- **Operasional Studio:** Dikelola secara terpusat oleh staf/owner melalui portal admin di `/admin`.

## Capabilities and Constraints

- **Alur Reservasi 5 Langkah:** Pemilihan paket foto, layanan tambahan (add-ons), pemilihan tanggal & slot jam real-time, pengisian data kontak, dan konfirmasi pemesanan.
- **Pencegah Tabrakan Jadwal:** Transaksi atomik database untuk menjamin satu slot jam hanya bisa ditempati satu pemesan pada tanggal yang sama.
- **Katalog & Portofolio:** Paket studio kurasi dan galeri foto resolusi tinggi dengan filter kategori interaktif dan modal lightbox eksibisi.
- **Panel Back-office Admin:** Ringkasan metrik (omzet, booking pending, jadwal hari ini), filter & pencarian reservasi, pengubahan status 1-klik, serta pengelolaan paket dan galeri.
- **Fault-Tolerant Resilience:** Lapisan cadangan terpusat (*fallback layer*) yang menjamin situs dan API tetap melayani pengguna meskipun database cloud mengalami latensi atau cold boot.
- **Konstrain Teknis:** Next.js 15 App Router, React 19, Tailwind CSS v4, Prisma ORM, Supabase PostgreSQL. Mata uang Rupiah (IDR).

## Brand Commitments

- **Nama Brand:** Snapbook Studio
- **Kontak Resmi:** WhatsApp `+6281234567890`, Instagram `@snapbookstudio`
- **Lokasi Fisik:** Jl. Studio Foto No. 10, Jakarta Selatan
- **Karakter Visual:** Editorial, warm modernism, minimalis mewah, tenang, dan terstruktur.

## Evidence on Hand

- Repositori aktif: `https://github.com/agungrmdniiii/Snapbook-Studio`
- Database cloud PostgreSQL aktif di Supabase (`whiyncjfocmnatbpknam`).
- Dokumentasi visual pratinjau sistem tersimpan di `public/preview-*.png` dan `README.md`.
- Suite audit otomatis E2E tervalidasi 100% lulus.

## Product Principles

1. **Transparansi Tanpa Friksi:** Harga, fasilitas, durasi sesi, dan ketersediaan jam disajikan secara lugas tanpa biaya tersembunyi.
2. **Kemandirian Klien (Frictionless Self-Service):** Klien dapat memilih jadwal dan mengecek status pesanan tanpa harus menunggu balasan admin manual.
3. **Ketahanan Mutlak (Zero-Downtime Resilience):** Klien tidak boleh terhalang melakukan booking akibat gangguan koneksi database sesaat.
4. **Elegan & Fungsional:** Antarmuka berkelas yang mengangkat nilai karya seni foto sekaligus mempercepat konversi pemesanan.
