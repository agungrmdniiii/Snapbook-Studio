import { ArrowUpRight } from 'lucide-react';
import { MotionLink } from './PublicMotion';
import { StudioFilm } from './StudioFilm';

export function StudioExperience() {
  return <section id="pengalaman" className="studio-experience" aria-labelledby="studio-experience-title">
    <div className="studio-section-heading"><h2 id="studio-experience-title">Di balik sesi foto.</h2><MotionLink href="/book" className="studio-text-link">Pesan sesi foto <ArrowUpRight size={18} /></MotionLink></div>
    <StudioFilm />
    <div className="studio-experience-steps">
      <div><h3>Booking</h3><p>Pilih paket, tanggal, dan jam. Simpan kode booking untuk memeriksa reservasi Anda.</p></div>
      <div><h3>Kedatangan</h3><p>Datang 10–15 menit lebih awal. Siapkan pakaian dan referensi foto sebelum sesi dimulai.</p></div>
      <div><h3>File foto</h3><p>File digital dan pilihan cetak mengikuti paket yang Anda pesan. Detailnya tercantum di setiap paket.</p></div>
    </div>
  </section>;
}
