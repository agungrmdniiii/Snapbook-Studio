# Perbaikan audit — rencana dan catatan eksekusi

Tujuan: menutup risiko akses publik dan autentikasi, memperbaiki integritas booking, kemudian mempercepat jalur publik dan menyiapkan konfigurasi hosting yang sesuai. Spesifikasi: AUDIT.md dalam folder ini; urutan mengikuti tingkat urgensi.

## Batas dan keputusan
- Proyek Supabase: whiyncjfocmnatbpknam. Proyek Vercel yang dikonfirmasi lewat domain: snapbook-studio / prj_j1BfemBjapJYk7ZuQXlGs8okPxgv / team_s7hhdUtjrRtI96BKy9KKdoVP.
- Cabang kerja codex/urgent-hardening mempertahankan perubahan lokal yang sudah ada; tidak membuat worktree kosong yang menghilangkan perubahan tersebut.
- Tidak menghapus booking/customer. Constraint baru diuji pada data lama dan tidak diterapkan bila terjadi konflik.
- Perubahan hosting/database yang diizinkan permintaan pengguna dijalankan setelah target dan kompatibilitas diverifikasi. Tidak membeli paket atau membuat layanan berbayar baru.
- Uji keamanan memakai local handler, data dummy dan transaksi uji yang dibatalkan; tidak mengulang percobaan token palsu produksi yang sebelumnya ditolak.

## Urutan
- [x] 1. RLS dan cabut grant akses langsung role publik; verifikasi aplikasi tetap bisa membaca lewat role backend.
- [x] 2. Hapus kredensial cadangan; secret wajib; expiry dan revokasi sesi; pembatasan laju request; tracking tidak cukup memakai telepon saja.
- [x] 3. Validasi booking, overlap durasi dan kunci transaksi per tanggal; kegagalan data tertutup; pemulihan status aman. Constraint exclusion ditunda karena satu bentrok historis.
- [x] 4. Pagination dan statistik admin, timezone WIB, snapshot paket baru, arsip booking. Penahanan slot tetap manual sesuai pilihan pengguna; tidak ada auto-expiry.
- [x] 5. Media berbasis URL, cache katalog terinvalidasi, paralelkan query; ketersediaan tetap langsung. Aktivasi URL foto lama menunggu aset di domain produksi.
- [x] 6. Region bom1, secret sesi dan Node24 diperbarui; deployment diuji lalu dipromosikan. Pooler belum diubah (lihat batas akses secret).
- [x] 7. Regresi, typecheck, build, advisors, smoke dan browser desktop/mobile lulus; ukuran serta waktu respons diukur ulang pada domain produksi.

## Bukti dan status
Login CLI berhasil setelah pengguna menyelesaikan device login. Target dikonfirmasi melalui project inspect dan domain. Connector mengembalikan 403 pada beberapa operasi, sehingga CLI memakai proyek dan scope yang sama.

## Perubahan penting
- Dua migrasi Supabase diterapkan: `restrict_direct_public_access`, `harden_sessions_and_booking_snapshots`. Delapan tabel kini RLS aktif dan grant anon/authenticated dicabut; akses backend Prisma tetap berfungsi. Salinan SQL untuk instalasi lain tersedia di `prisma/hardening.sql`.
- Sesi HMAC wajib secret minimal 32 byte, memiliki versi dan expiry tujuh hari; sesi lama tidak valid. Secret acak baru dibuat di memori dan dikirim langsung ke Vercel Production/Preview. Password baru minimal 12 karakter setelah trim. Pengubahan password atomik dengan konfigurasi dan mencabut sesi; logout gagal dapat diulang.
- Tidak ada login admin cadangan atau kredensial publik pada halaman login. Seeder mewajibkan kredensial eksplisit dan tidak mengubah admin yang sudah ada.
- Rate limiter PostgreSQL atomik: login 10/15 menit, booking 10/15 menit, tracking 20/15 menit; kegagalan limiter mengembalikan 503. Di Vercel identitas memakai header x-real-ip yang ditimpa platform; lokal berbagi satu bucket.
- Booking memvalidasi tanggal WIB, jam grid, durasi sampai tutup, paket/add-on aktif dan data pemesan. Semua jalur aktivasi booking memakai kunci transaksi per tanggal serta pemeriksaan overlap seluruh interval. Kode reservasi memakai randomBytes, harga dihitung server. Tidak ada default paket ketika database gagal.
- Tracking memerlukan kode booking DAN nomor WhatsApp yang cocok, tidak mengembalikan email/telepon/catatan. API booking admin memakai pagination default25 maksimal50; statistik mencakup seluruh hasil filter, tidak hanya halaman aktif.
- Snapshot nama/harga/durasi untuk booking baru; arsip menyimpan riwayat dan add-on. Tidak ada data booking lama dihapus atau dijadwalkan ulang.
- Katalog dibaca paralel, cache60 detik dengan invalidasi tag saat mutasi. Beranda memakai ISR. Foto tidak diserialisasi sebagai Base64 dalam HTML/API; thumbnail memakai Next Image untuk host yang didukung.
- Upload file menerima JPEG/PNG/WebP maksimal4 MiB, dengan pemeriksaan magic bytes dan body terbatas. Batas dibuat di bawah payload Vercel4.5MB: https://vercel.com/docs/functions/limitations. URL HTTPS tetap tersedia jika Storage belum dikonfigurasi.
- `vercel.json` mengatur fungsi bom1 (Mumbai), dekat database ap-south-1; sebelumnya iad1. Region build tetap iad1, berbeda dengan region eksekusi fungsi. Node dipatok24.x. Tidak mengubah paket berbayar, domain, atau mematikan Deployment Protection.
- Skrip uji lama yang membuat/menghapus data diganti pembungkus regresi mock dengan koneksi dummy tak aktif. Screenshot tidak lagi memakai password bawaan.

## Verifikasi
- 42 regresi lulus: auth/rate limit, booking/availability, tracking, status/arsip, katalog/media/Blob, settings atomik, pagination, dan kuitansi admin tetap memakai snapshot ketika katalog berubah.
- TypeScript seluruh proyek lulus. Build lokal dan build Vercel lulus; deployment uji terkonfirmasi fungsi bom1.
- `verify-hardening-db.mts` memverifikasi RLS8 tabel, tidak ada grant anon, SQL limiter, advisory lock dan rollback tanpa meninggalkan baris uji.
- Smoke test deployment terlindungi menggunakan `vercel curl` resmi: halaman publik200; endpoint admin anonim401; availability tanpa paket400; paket aktif200; tracking tanpa telepon400. Tidak mengirim token admin palsu atau membuat booking produksi.
- Advisor security tidak lagi menemukan error RLS; INFO RLS tanpa policy disengaja karena seluruh akses aplikasi melalui backend dan tidak ada hak Data API untuk publik. Referensi: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.
- Advisor performance hanya menyebut indeks baru belum dipakai; indeks baru tidak dihapus hanya karena data kecil. Referensi: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.

## Keputusan dan batas yang tetap berlaku
1. Pengguna memilih **tetap manual: admin membatalkan sendiri** untuk reservasi belum membayar DP. Tidak ada hold timeout atau pembatalan otomatis.
2. Satu pasang booking aktif lama saling bertabrakan. Tidak mengubah jadwal pelanggan. Exclusion constraint universal belum dapat dipasang; kunci aplikasi melindungi jalur pembuatan/pemulihan baru, tetapi penulisan SQL di luar aplikasi belum terlindung constraint interval.
3. Bukti harga paket saat booking lama dibuat tidak tersedia; snapshot hanya dijamin untuk booking baru. Booking lama tetap memakai data katalog sebagai fallback.
4. Upload file kini memakai Vercel Blob yang diprovisikan setelah persetujuan eksplisit pengguna (lihat catatan penyimpanan). Supabase Storage hanya fallback opsional dan tidak memerlukan service key untuk jalur Blob.
5. Pembacaan secret environment produksi ke file lokal ditolak pemeriksaan persetujuan otomatis karena risiko kredensial. Tidak mengulang dengan metode terselubung. DATABASE_URL produksi/pooler dan pengaturan pool belum diubah; audit lebih lanjut dapat memakai hostname/port tersanitasi yang diberikan pemilik tanpa password.
6. Tidak melakukan login admin produksi atau membuat booking nyata untuk pengujian browser; perubahan admin diuji dengan handler mock dan database dalam transaksi rollback.
7. Tidak merotasi password akun admin yang sudah ada tanpa mekanisme penyerahan kredensial aman; pemilik perlu mengganti melalui Pengaturan bila masih memakai password seed lama.
8. Font video Plus Jakarta Sans tetap sebagai identitas brand. Narrow ignore overused-font sudah tersimpan di .impeccable/config.json; tidak menambah ignore rule/file atau mengganti desain video.

## Lokasi bukti
`stage-checks.json`, `http-measurements.json` (sebelum), `http-after.json` (sesudah), folder `browser/`, dan kode regresi pada `tests/`.

## Hasil rilis
Domain https://snapbook-studio.vercel.app kini mengarah ke deployment `dpl_GEMxpVTkk48c8JdCeY8owNcguNQN`, status READY. CLI inspect mengonfirmasi fungsi bom1 dan Node24.x. Secret SESSION_SECRET tercatat untuk Production/Preview tanpa menampilkan nilainya. Branch lokal: codex/urgent-hardening; belum commit/push, perubahan lokal lama tetap dipertahankan.

Satu foto legacy231737 byte diekstrak ke `public/gallery/legacy-70db4af50dfd34a50219.jpg`. Setelah promosi, checksum aset pada domain produksi diverifikasi identik sebelum URL database diganti. Cache tag studio-catalog kemudian diinvalidasi. Tidak ada foto dihapus.

Browser Chromium pada1440×900 dan390×844 memeriksa beranda, memilih jam riil, maju sampai formulir pemesan, validasi tracking memerlukan telepon, serta halaman login tanpa password publik. Tidak ada horizontal overflow atau pageerror. Seluruh request mutasi diblokir oleh test; tidak ada booking uji produksi dibuat. Form admin sesudah login tidak diuji langsung karena tidak memakai kredensial pemilik.

Pengukuran dua request per rute dari lingkungan yang sama (sampel kecil, bukan jaminan semua perangkat/jaringan; cache dan cold start memengaruhi hasil):

| Rute | TTFB rata-rata sebelum | Sesudah | Ukuran respons sebelum → sesudah |
|---|---:|---:|---:|
| Beranda |2112ms|88ms|741714 →136253 byte|
| Booking |1246ms|146ms|44586 →44558 byte|
| API paket |3118ms|167ms|3270 →3270 byte|
| API galeri |1961ms|147ms|310659 →1692 byte|

Beranda setelah rilis menunjukkan cache HIT. API lain dapat menunjukkan CDN MISS karena cache katalog berada di Data Cache; availability tetap no-store dan menyertakan packageId.

Pengguna kemudian meminta memilih yang terbaik tanpa perlu memahami koneksi pooler. Keputusan: mempertahankan koneksi produksi yang telah terbukti berfungsi dan memakai perbaikan region/cache yang sudah terverifikasi; tidak meminta ulang secret atau mengganti kredensial/koneksi berdasarkan tebakan. Ada4 booking dan7 foto, tidak ada gambar inline atau sisa baris uji setelah rilis.

## Upload file: penyiapan penyimpanan
Paket Vercel terverifikasi **Hobby** lewat metadata team yang sama. Proyek belum memiliki Blob store. Pengaitan lokal CLI diarahkan secara eksplisit ke ID proyek yang telah dikonfirmasi; CLI membuat token development OIDC baru di .env.local (tidak memuat DATABASE_URL/DIRECT_URL produksi). File tetap diabaikan Git/deploy. Secret sesi development baru juga dibuat secara lokal, terpisah dari produksi.

Pembuatan store `snapbook-gallery` publik di region bom1 ditolak automatic approval review: resource persisten baru memerlukan persetujuan eksplisit karena biaya dan akses file. Tidak mengulang melalui API/metode lain. Integrasi SDK resmi disiapkan lokal untuk memakai OIDC proyek tanpa meminta service key Supabase; aktivasi menunggu izin resource tersebut. Referensi kuota Hobby dan OIDC: https://vercel.com/docs/vercel-blob/usage-and-pricing dan https://vercel.com/changelog/vercel-blob-now-supports-oidc-authentication. Tidak memulai trial/upgrade atau layanan berbayar.

Integrasi Blob2.8.2 sudah lolos42 regresi dan typecheck. SDK dimuat secara lazy hanya saat upload yang telah dikonfigurasi; path UUID gallery/, MIME diverifikasi, tidak menimpa file, cache setahun. Persetujuan pembuatan store ditanyakan setelah implementasi siap diverifikasi.

Pengguna menyetujui **“Ya, buat penyimpanan galeri”**. Store `snapbook-gallery` / `store_V834zyBbtJASTi4C` kemudian dibuat publik di bom1 dan ditautkan ke Production/Preview/Development. CLI menginjeksi konfigurasi BLOB_READ_WRITE_TOKEN secara otomatis; nilainya tidak dicetak penuh atau dibawa ke bundle client. Tidak memulai upgrade/trial. Uji integrasi aktual lewat helper aplikasi berhasil: unggah PNG pixel dummy96 byte, baca publik200, checksum cocok, lalu hanya objek dummy itu dihapus. Tidak ada baris galeri/booking diubah oleh uji ini. Jalur upload aktif sesudah deployment SDK.

Pemeriksaan npm setelah pemasangan SDK menemukan6 advisory yang berasal dari rantai Prisma/deepmerge-ts, PostCSS/Next dan esbuild, bukan SDK Blob. Pembaruan major Prisma/Next tidak dipaksakan dalam rilis ini. Sebagian menyangkut pengolahan konfigurasi/CSS/build, yang tidak menerima input publik pada aplikasi ini; ini bukan bukti kerentanan runtime sudah dieksploitasi. Perlu peninjauan dependensi tersendiri: https://github.com/advisories/GHSA-ggr8-5vv4-36mx, https://github.com/advisories/GHSA-fxqj-rqcc-2cmp, https://github.com/advisories/GHSA-g7r4-m6w7-qqqr.

## Penutupan temuan audit
| No. | Status |
|---|---|
|1 RLS/grants|Diperbaiki dan diverifikasi langsung pada database.|
|2 Kredensial/secret cadangan|Dihapus; secret produksi baru dikonfigurasi. Password admin yang sudah ada tidak direset.|
|3 Bentrok/konkurensi|Semua jalur aplikasi memakai kunci tanggal dan interval; bentrok historis masih perlu ditinjau pemilik sebelum constraint universal.|
|4 Validasi|Tanggal/jam/durasi/paket/add-on dan pemesan diperiksa server.|
|5 Fallback palsu|Booking/availability/admin list/settings kini mengembalikan kegagalan yang terlihat.|
|6 Expiry sesi|Tujuh hari plus versi revokasi, diperiksa terhadap database.|
|7 Tracking telepon saja|Kode dan nomor yang cocok wajib, disertai limiter.|
|8 Base64|Satu foto dimigrasikan; nol data URL tersisa; gambar terpisah dan responsif.|
|9 Cache|ISR beranda dan Data Cache katalog60 detik, invalidasi saat edit.|
|10 Pagination/indeks|Default25/maks50, statistik seluruh filter dan tiga indeks FK.|
|11 Hold tanpa batas|Dipertahankan dengan sengaja sesuai pilihan pengguna: pembatalan manual admin.|
|12 WIB/reset jam|Dashboard dan pemilihan slot mengikuti WIB; pilihan jam dihapus saat tanggal/paket berubah.|
|13 Snapshot|Booking baru menyimpan nama/harga/durasi; kuitansi admin dan tracking memakai snapshot. Riwayat lama tidak ditebak.|
|14 Hapus riwayat|Diganti arsip satu update; relasi dan booking dipertahankan.|
|15 Uji destruktif|Skrip lama diganti regresi mock; koneksi cadangan tidak dapat menjangkau produksi.|

Rilis final upload: https://snapbook-studio-eb2lo7omh-agungrmdniiiis-projects.vercel.app, teralias ke domain utama. Build Vercel dan typecheck final lulus; smoke produksi halaman200, admin401, upload anonim401, galeri7 foto. Integrasi penyimpanan baru sudah aktif; tidak ada persetujuan tertunda untuk Blob. Kode tersimpan lokal pada cabang codex/urgent-hardening, belum commit/push.
