# Audit Snapbook Studio — 19 Oktober 2026

Snapbook Studio melayani katalog studio foto, booking mandiri, pelacakan booking, serta pengelolaan reservasi, paket, galeri dan pengaturan studio. Audit mengasumsikan satu studio dengan beberapa admin dan customer yang bisa booking bersamaan dari ponsel. Ini audit kode kerja saat ini dan database Supabase yang terhubung; kesesuaian commit produksi belum dibuktikan.

**Kesimpulan: ada masalah nyata pada keamanan, ketepatan booking, dan jalur pengiriman halaman. Memperbesar paket database belum menjadi perbaikan pertama yang didukung bukti.**

## Bukti dan batas pengukuran

- Supabase project teridentifikasi dari repo dan connector: `whiyncjfocmnatbpknam`, status ACTIVE_HEALTHY, region `ap-south-1`, PostgreSQL 17.11.0.003.
- Database saat diperiksa: **4 booking**, **7 gambar**, **2 booking PENDING berumur lebih dari 24 jam**. Statistik query sejak reset 9 Oktober menunjukkan SELECT utama rata-rata sekitar **0,125–0,797 ms** dan INSERT booking sekitar **3,787 ms**. Ini waktu eksekusi di Postgres, bukan latensi ujung ke ujung.
- Pengukuran HTTP publik dua putaran, lima rute, satu mesin pengaudit. Ini sampel diagnostik kecil, bukan p95, bukan Lighthouse, dan bukan Core Web Vitals pengguna nyata. Ada satu pengukuran awal lain yang berjalan pada waktu berdekatan; angka yang dilaporkan berikut berasal dari file `http-measurements.json`.

| Rute | Respons awal putaran 1 / 2 | Waktu total putaran 1 / 2 | Ukuran body setelah decode |
|---|---:|---:|---:|
| `/` | 2.054 / 2.170 ms | 3.500 / 3.385 ms | 741.714 byte |
| `/book` | 1.247 / 1.244 ms | 1.248 / 1.247 ms | 44.586 byte |
| `/api/packages` | 4.060 / 2.175 ms | 4.061 / 2.176 ms | 3.270 byte |
| `/api/gallery` | 1.945 / 1.977 ms | 2.829 / 2.873 ms | 310.659 byte |
| `/api/bookings/available-slots` | 2.367 / 1.200 ms | 2.368 / 1.202 ms | 586 byte |

Seluruh sampel `x-vercel-cache: MISS`. Halaman `/` dan `/book` memakai `private, no-cache, no-store`. Angka body bukan transfer terkompresi dan bukan seluruh berat halaman beserta JavaScript/foto eksternal.

- Pemeriksaan TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false` lulus.
- Enam reproduksi lokal menjalankan handler booking asli dengan seluruh akses database diganti objek dalam memori. Tidak membuat booking di Supabase. Bukti: `isolated-results.json`, cara ulang: `node --import tsx docs/audits/2026-10-19/isolated-check.mts`.
- Tidak menjalankan skrip E2E lama karena skrip tersebut menulis/menghapus data database yang dikonfigurasi.

## Harus diperbaiki

### 1. [P0] Ketujuh tabel publik tidak memakai RLS dan role anon mendapat CRUD

**Apa ini:** RLS menentukan baris yang boleh dibaca/diubah melalui role database pengguna. Supabase Security Advisor menandai tujuh tabel, termasuk `AdminUser`, `Booking`, dan `BookingAddOn`.

**Masalah:** Pemeriksaan izin mengonfirmasi role `anon` punya SELECT, INSERT, UPDATE, DELETE pada ketujuh tabel; kolom `AdminUser.passwordHash` juga boleh dibaca role tersebut. Ini jalur akses database yang terpisah dari pemeriksaan login API Next.js. Detail ada di `database-evidence.json`; tidak ada hash password yang dibaca dalam audit.

**Perbaikan minimum:** Tentukan akses database yang benar-benar dipakai. Untuk arsitektur Prisma server-only ini, batasi grant `anon`/`authenticated` atas tabel internal, aktifkan RLS sesuai model akses, dan pertimbangkan menonaktifkan Data API bila tidak diperlukan. Uji booking dan admin memakai role backend setelah pembatasan; jangan menambahkan policy `true` ke semua tabel.

**Jika dibiarkan:** Bila tabel diakses melalui Data API yang terbuka, login aplikasi tidak melindungi data pada jalur tersebut. Status pengaturan Data API secara independen belum dibuktikan; konfigurasi grant/RLS yang berbahaya sudah dibuktikan. [Panduan remediasi Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).

### 2. [P0 bersyarat] Login dan penandatanganan sesi memiliki kredensial cadangan dalam kode

**Sumber:** `src/app/api/auth/login/route.ts:14`, `:30`; `src/lib/auth.ts:4`.

**Masalah:** Jika pencarian admin gagal atau akun tidak ditemukan, login menerima pasangan username/password bawaan dalam kode. Penandatanganan sesi juga memakai secret konstan ketika `SESSION_SECRET` kosong; variabel tersebut tidak ditemukan dalam `.env` lokal yang diperiksa. Environment produksi belum diperiksa.

**Perbaikan minimum:** Hapus login cadangan; error database harus menolak autentikasi. Wajibkan secret yang kuat saat startup, lalu rotasi secret dan password default pada deployment yang pernah menggunakannya. Tambahkan pembatasan percobaan login yang dibagi antar-instance.

**Jika dibiarkan:** Gangguan database dapat membuka jalur login memakai kredensial yang diketahui dari sumber, dan deployment tanpa secret khusus berisiko pemalsuan sesi. Uji autentikasi produksi tidak dilakukan; tingkat paparan produksinya masih perlu pemeriksaan resmi yang disetujui.

### 3. [P1] Pencegahan bentrok belum melindungi rentang waktu atau booking bersamaan

**Sumber:** `src/app/api/bookings/route.ts:112`; `src/app/api/bookings/available-slots/route.ts:30`; `prisma/schema.prisma:58`; `src/app/api/bookings/[id]/status/route.ts:27`.

**Masalah:** Kode hanya mencocokkan `date + startTime`. Contoh yang direproduksi: booking 09:00–10:30 sudah ada, booking baru mulai 10:00 tetap diterima HTTP 200. Di database nyata tidak ada constraint larangan overlap atau unique slot aktif; isolation default `read committed`. Dua transaksi yang sama-sama membaca sebelum salah satunya commit masih bisa sama-sama membuat booking. Memulihkan booking CANCELLED ke PENDING juga tidak memeriksa slot yang sudah dipakai ulang.

**Perbaikan minimum:** Definisikan kapasitas studio, lalu lindungi interval `[mulai, selesai)` di database, misalnya exclusion constraint untuk reservasi aktif per resource. Semua jalur create/reschedule/restore harus menghormati constraint yang sama. Pastikan opsi yang dipakai didukung database dan terapkan lewat migrasi setelah pengujian sandbox. Interval yang bertemu tepat di batas akhir boleh berurutan. Availability harus mempertimbangkan durasi paket yang dipilih, jam tutup, dan buffer bila ada.

**Jika dibiarkan:** Jadwal tetap bisa bertabrakan meskipun ada `$transaction`. Uji konkurensi nyata tidak dijalankan pada produksi; bukti race adalah analisis transaksi dan constraint, sedangkan overlap durasi telah direproduksi lokal.

### 4. [P1] Server menerima tanggal lampau, jam bebas, dan paket nonaktif

**Sumber:** `src/app/api/bookings/route.ts:68`, `:78`, `:81`, `:87`; `src/lib/utils.ts:36`.

**Masalah:** Validasi server terutama mengecek nilai tidak kosong. Reproduksi lokal menerima tanggal 2020-01-01 dan jam 23:17, lalu menghasilkan akhir **24:47**. Paket nonaktif tetap diterima. ID paket yang tidak ada diam-diam diganti paket default. Mengubah `slotDuration` menjadi nilai negatif juga tidak ditolak API settings dan bisa membuat loop pembentukan slot tidak berakhir.

**Perbaikan minimum:** Validasi tipe/panjang input, tanggal WIB, format dan kelipatan jam, jam operasional, akhir sesi, durasi positif, serta status aktif paket/add-on. Tolak ID tidak dikenal dengan 400/404; jangan mengganti pilihan paket secara diam-diam. Gunakan aturan yang sama untuk create dan perubahan jadwal.

**Jika dibiarkan:** Pembatasan tombol di browser dapat dilewati lewat API dan data operasional menjadi tidak sah. Kasus jam, tanggal, paket nonaktif, dan ID tidak dikenal diuji memakai database tiruan.

### 5. [P1] Gangguan database ditampilkan sebagai slot kosong atau daftar booking kosong

**Sumber:** `src/app/api/bookings/available-slots/route.ts:41`, `:69`; `src/components/booking/StepDateTime.tsx:103`; `src/app/api/bookings/route.ts:57`.

**Masalah:** API dan UI sama-sama memiliki fallback semua jam tersedia ketika pembacaan gagal. Reproduksi kegagalan database menghasilkan HTTP 200 dan **11/11 slot tersedia**. API admin juga mengembalikan `[]` HTTP 200 ketika query gagal, seolah tidak ada booking.

**Perbaikan minimum:** Availability yang tidak dapat diverifikasi harus menampilkan gagal memuat, menonaktifkan lanjut, dan menawarkan coba ulang. Kembalikan 503/galat terstruktur pada kegagalan operasional. Fallback konten pemasaran dapat tetap ada dengan status yang jelas; jangan pakai fallback seolah data reservasi aktual.

**Jika dibiarkan:** Customer memilih slot yang tidak benar-benar kosong dan admin salah membaca keadaan studio. Perubahan timeout saja tidak memperbaiki kekeliruan ini.

### 6. [P1] Token sesi tidak kedaluwarsa pada server

**Sumber:** `src/lib/auth.ts:28`; `src/app/api/auth/logout/route.ts:5`; `src/app/api/settings/route.ts:66`.

**Masalah:** Cookie diberi umur tujuh hari, tetapi verifier hanya memeriksa tanda tangan; nilai `iat` tidak dibatasi. Token bertanggal tahun 2000 diterima dalam reproduksi lokal. Logout menghapus cookie di browser, tetapi salinan token tetap valid. Mengganti password juga tidak membatalkan sesi lama.

**Perbaikan minimum:** Verifikasi struktur payload dan batas waktu pada server. Tambahkan mekanisme revokasi atau versi sesi yang diperiksa setelah logout/perubahan password. Supabase Auth bisa menjadi opsi pengganti auth buatan sendiri, tetapi migrasi bukan syarat untuk memperbaiki batas umur.

**Jika dibiarkan:** Token yang disalin dapat dipakai kembali melewati umur cookie. Tidak ada token admin produksi yang diambil atau diuji dalam audit ini.

### 7. [P1] Pelacakan data booking cukup dengan nomor telepon tanpa verifikasi

**Sumber:** `src/app/api/bookings/track/route.ts:18`; `src/app/api/bookings/route.ts:107`.

**Masalah:** Mengetahui nomor telepon dapat mengembalikan nama, jadwal, paket, total dan status booking terbaru. Kode booking menggunakan suffix empat digit yang tidak dirancang sebagai rahasia kuat. Tidak ditemukan pembatasan laju di kode route/aplikasi yang dibaca; konfigurasi firewall luar aplikasi belum diperiksa.

**Perbaikan minimum:** Gunakan token pelacakan acak yang panjang atau verifikasi nomor dengan OTP, minimalkan respons, dan pasang rate limit bersama. Bila pencarian nomor tetap diperlukan, minta faktor pembuktian tambahan.

**Jika dibiarkan:** Orang yang mengetahui nomor customer dapat mengetahui jadwalnya. Tidak melakukan enumerasi nomor atau kode milik customer.

## Sebaiknya diperbaiki

### 8. [P1 performa] Foto Base64 ikut membengkakkan HTML dan respons API

**Sumber:** `src/app/admin/gallery/page.tsx:42`, `:112`, `:135`; `src/app/api/gallery/route.ts:38`; `src/app/page.tsx:26`; `src/components/landing/ShowcaseGallery.tsx:106`.

**Masalah:** Upload menghasilkan data URL lalu disimpan langsung dalam kolom `ShowcaseImage.url`. Database nyata berisi satu data URL **309.007 byte**. `/api/gallery` berukuran **310.659 byte** dan body beranda **741.714 byte**. Karena gambar inline sudah menjadi bagian HTML/data React, `loading="lazy"` pada img tidak mencegah string itu ikut diunduh. Sebagian representasi dapat ikut muncul lagi pada payload React.

**Perbaikan minimum:** Simpan file di Supabase Storage atau object storage/CDN, kolom database hanya URL/path dan metadata. Migrasikan data URL yang ada tanpa kehilangan foto, sediakan ukuran thumbnail/responsif, lalu ukur ulang body dan waktu render. Kebijakan akses bucket harus disesuaikan, bukan membuka semua operasi.

**Jika dibiarkan:** Setiap foto baru menambah beban database, API, HTML dan parsing browser. Ini penyebab ukuran payload yang sudah terverifikasi, tetapi kontribusi pastinya terhadap LCP belum diukur.

### 9. [P1 performa] Konten katalog dibaca ulang tanpa cache yang efektif

**Sumber:** `src/app/page.tsx:12`, `:20`; `src/app/book/page.tsx:8`; `src/app/api/packages/route.ts:15`, `:20`; `src/lib/constants.ts:172`.

**Masalah:** Landing dan booking `force-dynamic`, masing-masing mengambil konfigurasi/katalog dari database. Endpoint paket melakukan query paket lalu add-on secara berurutan. Sepuluh respons yang diukur semuanya MISS. Cache konfigurasi yang ada hanya memori per instance, hanya dipakai sebagian jalur, dan invalidasinya tidak menyegarkan instance lain.

**Perbaikan minimum:** Cache konten publik yang jarang berubah dengan mekanisme Next.js yang sesuai dan invalidasi setelah edit admin. Jalankan query independen paralel. Availability tetap segar dan create tetap memeriksa ulang secara atomik; jangan menyelesaikan latensi dengan cache slot yang lama.

**Jika dibiarkan:** Tiap kunjungan membayar kembali biaya jaringan/koneksi/query yang sama. Selisih query DB sub-ms dengan HTTP detik menunjukkan perlunya tracing koneksi, lokasi fungsi, cold start dan render; audit ini belum mengisolasi seluruh penyebabnya.

Konfigurasi **lokal** `DATABASE_URL` dan `DIRECT_URL` sama-sama memakai direct endpoint 5432 tanpa parameter. Untuk fungsi serverless, verifikasi connection pooling dan lokasi fungsi produksi. Dokumentasi Supabase menyarankan transaction pooler untuk koneksi sementara, dengan pengaturan Prisma yang sesuai. Jangan mengganti URL produksi hanya berdasarkan `.env` lokal. [Referensi koneksi resmi](https://supabase.com/docs/guides/database/connecting-to-postgres), [panduan Prisma](https://supabase.com/docs/guides/database/prisma).

### 10. [P2 skalabilitas] Daftar booking tanpa pagination dan tiga foreign key belum diindeks

**Sumber:** `src/app/api/bookings/route.ts:45`; `src/app/admin/bookings/page.tsx:68`, `:130`; `prisma/schema.prisma:80`.

**Masalah:** API mengirim semua booking dan relasinya, lalu browser menghitung statistik dari seluruh daftar. Supabase Performance Advisor menemukan index foreign key yang belum ada pada `Booking.packageId`, `BookingAddOn.bookingId`, `BookingAddOn.addOnId`. Pencarian contains pada beberapa kolom juga perlu dinilai saat jumlah data bertambah.

**Perbaikan minimum:** Tambahkan pagination, select kolom yang diperlukan dan agregasi statistik yang scope-nya jelas. Tambahkan index relasi; nilai index tambahan untuk telepon/urutan melalui EXPLAIN sesuai pola query, bukan mengindeks setiap kolom.

**Jika dibiarkan:** Halaman admin membesar seiring seluruh riwayat studio. Dengan empat booking sekarang, index yang hilang ini **belum terbukti** sebagai penyebab utama kelambatan saat ini. [Remediasi advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

### 11. [P2 fitur] Reservasi belum dibayar dapat menahan slot tanpa batas

**Sumber:** `prisma/schema.prisma:58`; `src/app/api/bookings/available-slots/route.ts:28`; `src/app/api/bookings/route.ts:135`.

**Masalah:** Semua PENDING memblokir slot, tetapi tidak ada batas hold/expiry pada model dan tidak ditemukan pekerjaan terjadwal yang melepaskannya. Database saat audit sudah berisi dua PENDING lebih dari 24 jam; ini bukan bukti kedua booking harus dibatalkan, tetapi memperlihatkan kebutuhan aturan operasional yang eksplisit.

**Perbaikan minimum:** Tentukan kebijakan masa hold bersama pemilik studio, simpan waktu kedaluwarsa, dan sediakan pelepasan otomatis serta tampilan hitung mundur/peringatan. Booking DP terverifikasi tidak boleh dilepas sebagai pending biasa.

**Jika dibiarkan:** Reservasi ditinggalkan customer dapat membuat studio tampak penuh sampai admin membersihkannya manual.

### 12. [P2] Hari dashboard memakai UTC dan pilihan jam tidak direset saat tanggal berganti

**Sumber:** `src/app/admin/page.tsx:23`; `src/components/booking/BookingWizard.tsx:227`; `src/components/booking/StepDateTime.tsx:87`.

**Masalah:** Dashboard mengambil hari dengan ISO UTC. Pada 00:00–06:59 WIB, hari dashboard tertinggal satu hari. Pada wizard, mengganti tanggal hanya mengganti selectedDate; selectedTime lama masih disimpan meski slot pada tanggal baru terisi. Validasi lanjut hanya mengecek nilai tidak kosong.

**Perbaikan minimum:** Gunakan satu timezone studio untuk semua perhitungan tanggal. Kosongkan dan validasi ulang pilihan jam ketika tanggal/paket berubah dan setelah refresh availability.

**Jika dibiarkan:** Agenda pagi tidak sesuai tanggal studio dan customer baru mengetahui konflik setelah selesai mengisi data. Bagian ini dikonfirmasi lewat jalur kode, belum diuji interaksi browser pada audit ini.

### 13. [P2] Harga rincian booking lama berubah ketika katalog diedit

**Sumber:** `prisma/schema.prisma:58`, `:86`; `src/components/admin/BookingTable.tsx:388`.

**Masalah:** Add-on memiliki `priceAtBooking`, tetapi harga/nama/durasi paket tidak disalin ke booking. Rincian admin memakai `selectedBooking.package.price` yang merupakan harga katalog terkini. Contoh: paket naik dari Rp150.000 ke Rp175.000, total booking lama tetap, tetapi komponen harga rincian berubah.

**Perbaikan minimum:** Simpan snapshot harga dan informasi paket yang diperlukan pada waktu pemesanan; gunakan snapshot untuk receipt/laporan. Tentukan penanganan data lama secara eksplisit.

**Jika dibiarkan:** Rincian biaya historis tidak konsisten dengan total yang disepakati, walaupun `totalPrice` sendiri sudah tersimpan.

### 14. [P2] Hapus booking menghilangkan riwayat dan tidak atomik

**Sumber:** `src/app/api/bookings/[id]/route.ts:58`; `src/app/admin/page.tsx:35`.

**Masalah:** API menghapus relasi add-on lalu booking dengan dua operasi terpisah. Jika operasi kedua gagal, detail add-on bisa hilang. Hard delete juga membuat booking beserta kontribusi statistik omzetnya menghilang; tidak ada audit trail siapa melakukan perubahan.

**Perbaikan minimum:** Utamakan pembatalan/arsip untuk aktivitas operasional, simpan jejak perubahan penting, dan lakukan penghapusan yang memang diperlukan secara atomik. Skema sudah memiliki cascade sehingga hapus relasi manual bukan satu-satunya pilihan.

**Jika dibiarkan:** Kesalahan admin sulit dipulihkan dan laporan historis dapat berubah tanpa jejak.

### 15. [P2 verifikasi] Skrip E2E lama dapat memberi keyakinan palsu dan menyentuh data nyata

**Sumber:** `scripts/test-all-features-e2e.ts:89`, `:100`, dan bagian cleanup di akhir skrip; `package.json:7`.

**Masalah:** Uji bentrok dijalankan berurutan dan hanya memeriksa respons bukan 200; error 500 juga bisa dianggap proteksi berhasil. Skrip membuat/menghapus booking, paket dan galeri memakai database environment aktif; cleanup tidak berada dalam finally. Tidak ada test script/CI yang menguji konkurensi, overlap durasi, sesi kedaluwarsa atau kegagalan DB.

**Perbaikan minimum:** Pisahkan database pengujian, periksa status 409 secara tepat, uji dua booking bersamaan dan overlap 90 menit, serta cleanup terjamin. Tambahkan pengujian kegagalan agar fallback HTTP 200 tidak lolos sebagai keberhasilan.

**Jika dibiarkan:** Label “100% passing” tidak membuktikan sistem aman terhadap kasus yang menyebabkan bentrok dan data tidak sah. Audit ini tidak menjalankan skrip mutatif tersebut.

## Fitur yang paling layak dibangun

Ini usulan prioritas berdasarkan alur studio, bukan klaim semua fitur berikut sudah dijanjikan atau wajib ditambahkan sekaligus.

| Prioritas | Fitur | Keadaan sekarang | Manfaat |
|---|---|---|---|
| 1 | Kalender harian/mingguan + reschedule tervalidasi | Ada tabel dan pemilih filter tanggal; tidak ada API mengubah jadwal booking | Admin mengatur jadwal tanpa hapus-buat ulang |
| 1 | Batas hold PENDING + pencatatan DP | Status ditandai manual; belum ada masa hold atau ledger pembayaran | Slot tidak terkunci selamanya; pembayaran bisa ditelusuri |
| 1 | Hari libur, blok jam, buffer dan kapasitas studio | Hanya jam buka/tutup serta durasi slot global | Ketersediaan sesuai operasional nyata |
| 2 | Pembaruan booking masuk di admin | Data dimuat saat filter berubah atau tombol Muat Ulang | Reservasi baru cepat terlihat; mulai dari refresh terkontrol sebelum membutuhkan Realtime |
| 2 | Pengingat dan notifikasi otomatis | Tombol berisi tautan `wa.me`; masih memerlukan klik/kirim manual | Mengurangi pekerjaan admin dan customer tidak hadir |
| 2 | Upload foto ke Storage/CDN | Base64 disimpan di Postgres | Memperbaiki performa sekaligus pengelolaan media |
| 3 | Riwayat status, pembayaran, perubahan jadwal dan arsip | Tidak ada model audit trail | Kesalahan bisa ditelusuri dan laporan tetap konsisten |
| 3 | Pelacakan booking dengan verifikasi + daftar booking customer | Nomor telepon mengembalikan booking terakhir saja | Privasi dan pengalaman customer lebih baik |

Otomasi WhatsApp memerlukan jalur pengiriman/provider yang sah serta pencatatan delivery/retry; tautan `wa.me` bukan pengiriman otomatis. Tidak perlu memindahkan seluruh aplikasi ke Supabase client atau Edge Functions untuk memperbaiki temuan ini; Prisma masih dapat dipakai dengan akses database yang dibatasi.

## Urutan pengerjaan yang disarankan

1. **Amankan akses:** RLS/grants/Data API, hapus kredensial cadangan, secret wajib, expiry/revokasi sesi.
2. **Benarkan mesin booking:** overlap dan konkurensi di database, validasi server, pemulihan status aman, hentikan fallback slot kosong palsu.
3. **Percepat jalur publik:** keluarkan Base64 dari Postgres/HTML, cache katalog yang aman, paralelkan query independen, ukur ulang. Telusuri koneksi dan lokasi fungsi produksi sebelum memutuskan pindah region/upgrade paket.
4. **Lengkapi operasional:** reschedule/kalender, batas hold/DP, jam blok, pembaruan otomatis, lalu notifikasi.
5. **Tambahkan pengujian dan pengukuran:** sandbox, concurrency test, tracing waktu koneksi/query/render, dan Core Web Vitals pengguna nyata.

## Dokumentasi yang diverifikasi

Changelog resmi dibaca pada 19 Oktober 2026. PostgreSQL 17.11 memang versi proyek saat ini. Perubahan yang relevan untuk ditinjau mencakup ltree/pgcrypto/btree_gist/custom operator; metadata publik yang diperiksa tidak memiliki kolom ltree atau GiST index dan kode aplikasi tidak menunjukkan pemakaian enkripsi PGP legacy. Ini tidak menggantikan audit extension/privileged function menyeluruh. Perubahan TLS API yang dijadwalkan 10 November belum menjelaskan kelambatan saat audit ini.

- [Changelog Supabase](https://supabase.com/changelog)
- [PostgreSQL 15.19 / 17.11 breaking changes](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes)
- [Perubahan cipher TLS](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
- [Prisma di Supabase](https://supabase.com/docs/guides/database/prisma)
- [Metode koneksi Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Pengamanan akses data](https://supabase.com/docs/guides/database/secure-data)

## Yang belum diperiksa / batas otorisasi

- Environment, log, region fungsi dan firewall Vercel produksi; versi commit yang live; CDN waterfall, JavaScript execution, LCP/INP/CLS pada perangkat pengguna.
- Uji beban/konkurensi yang membuat booking pada database nyata, pembayaran/provider WhatsApp, mekanisme backup/restore, kebijakan bucket bila nanti menggunakan Storage.
- Pengujian token sesi terhadap produksi tidak dijalankan: pemeriksaan persetujuan otomatis menolaknya sebagai percobaan autentikasi menggunakan secret dari sumber. Tidak dilakukan workaround. Bukti kelemahan sesi berasal dari kode dan reproduksi lokal saja.
- Membaca jalur utama booking, availability, tracking, autentikasi, admin, CRUD paket/galeri/settings, skema dan cache; bukan review setiap baris styling, seluruh dependensi transitif, atau proyek video.

**Verdict:** tangani temuan 1–7 sebelum menambah otomasi atau memperbesar penggunaan. Setelah itu, temuan 8–10 adalah pekerjaan performa utama; fitur kalender/reschedule dan pengelolaan DP memberi dampak operasional terbesar.

Tidak ada perubahan kode aplikasi, migrasi, grant, RLS, data customer, atau konfigurasi deployment yang diterapkan. Perubahan sesi audit hanya berkas laporan dan alat reproduksi terisolasi dalam folder ini.
