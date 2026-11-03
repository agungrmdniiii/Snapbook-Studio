# Pemilihan paket publik

Tujuan: mempercepat perbandingan paket dan memperjelas perpindahan ke jadwal, dengan identitas visual yang sudah ada.

1. Tambahkan ringkasan harga dan durasi dari katalog aktif di atas kartu. Setiap tautan membawa pengunjung ke detail paket yang sama, bukan membuat harga atau ketersediaan baru.
2. Gunakan komponen fasilitas yang sama pada landing dan langkah paket booking. Dua fasilitas awal tetap terlihat; sisanya tersedia melalui disclosure native. Tangani JSON lama yang bukan array agar halaman tidak gagal.
3. Hilangkan tombol bersarang dalam tautan pada kartu landing, beri nama aksi yang menyebut paket, dan tampilkan pilihan aktif pada booking. Hapus penekanan populer yang ditentukan hanya dari urutan kartu.
4. Periksa desktop dan 390 px: tautan detail, disclosure dengan keyboard, paket terpilih setelah menuju booking, dan katalog kosong. Jalankan tes parser, tes aplikasi dan build; lalu push main dan periksa deployment.

Harga, durasi, deskripsi dan isi fasilitas tetap berasal dari katalog. Tidak ada perubahan database atau pengiriman reservasi produksi.

## Verifikasi

67 tes lulus dan build berhasil. Preview lokal memakai komponen aplikasi dengan katalog dummy karena koneksi database lokal tidak tersedia. Diperiksa pada desktop dan 390 px: ringkasan empat paket, tautan ke detail, fasilitas dibuka dengan Enter, tidak ada tombol bersarang pada tautan paket, paket wisuda dan keluarga terbawa ke jadwal, penanda pilihan aktif, serta pesan katalog kosong. Tidak ada overflow horizontal di ponsel. Pemeriksaan produksi mengikuti deployment GitHub.
