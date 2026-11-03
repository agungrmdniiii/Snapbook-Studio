# Peningkatan pengalaman publik Snapbook

Kerjakan dan verifikasi secara berurutan dengan identitas gelap-editorial yang sudah ada.

1. Pembuka sinematik: periksa video milik pengguna; gunakan hanya jika relevan. Foto Indonesia menjadi poster dan fallback. Sediakan kontrol putar/jeda, reduced motion, dan hentikan playback saat keluar layar. Hero dan CTA tetap terbaca di ponsel.
2. Koleksi foto: kelompokkan karya menurut koleksi yang memiliki sumber jelas. Pertahankan unggahan admin, kredit stok, dan hubungan ke paket asli. Jangan menyatukan orang berbeda sebagai satu sesi pelanggan.
3. Scroll: satu transisi perluasan pembuka ke galeri pada desktop, gerak ringan di ponsel, tanpa menghalangi scroll dan reduced motion.
4. Booking: ringkasan paket, tanggal, jam, tambahan, total selalu mudah dijangkau. Sidebar desktop dan disclosure bawah layar di ponsel. Pertahankan validasi slot dan penghitungan dari katalog.
5. Pengalaman studio: tampilkan proses dan hasil yang benar-benar didukung data. Foto ruangan, backdrop dan hasil cetak memerlukan aset studio; jangan mengklaim stok sebagai fasilitas asli.

Validasi: pemeriksaan tipe, tes yang relevan, build, browser desktop dan 390 px; uji navigasi, media gagal/reduced motion, perubahan pilihan booking tanpa membuat reservasi produksi. Commit setiap tahap yang selesai; push main dan periksa deployment Vercel. Jangan menyertakan file kerja lain.

## Hasil implementasi

- Pembuka memakai empat foto Indonesia dengan gerakan kamera dan crossfade 6,5 detik. Video pengguna merupakan promosi sistem booking, sehingga tidak digunakan untuk mengilustrasikan sesi pemotretan. Kontrol manual, pause saat keluar layar/tab tidak aktif, dan reduced motion disediakan.
- Koleksi keluarga memuat tiga foto Philip Elma dari Malang, lengkap dengan sumber dan label stok. Foto unggahan admin tetap ada.
- Bingkai pembuka melebar dengan CSS view timeline pada desktop yang mendukungnya. Browser lain menampilkan bingkai normal; ponsel dan reduced motion tidak memakai efek ini.
- Ringkasan booking tampil sebagai sidebar sticky di desktop dan disclosure bawah layar di ponsel. Total diuji melalui pemilihan tambahan cetak; Ubah paket menutup panel dan kembali ke pemilihan paket.
- Informasi booking, kedatangan dan file foto ditambahkan. Foto interior, backdrop dan contoh cetak studio belum tersedia, sehingga bagian tersebut masih memerlukan aset asli.
- Pemeriksaan tampilan lokal memakai komponen aplikasi dengan katalog dummy karena koneksi database lokal tidak tersedia. Tes aplikasi dan build berhasil. Pemeriksaan produksi dilakukan setelah deployment.
