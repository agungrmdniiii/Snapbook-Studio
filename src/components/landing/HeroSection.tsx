'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { MotionLink as Link } from './PublicMotion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { PhotoPreview } from './PhotoPreview';
const portrait = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=90';
export const HeroSection = () => {
  const [preview, setPreview] = useState(false);
  return (
    <section className="studio-hero">
      <div className="studio-hero-heading">
        <h1>Foto sendiri,<br /><em>atau bersama.</em></h1>
        <a href="#galeri" className="studio-explore" aria-label="Jelajahi galeri karya"><ArrowDown size={20} /></a>
      </div>
      <button className="studio-hero-photo" onClick={() => setPreview(true)} aria-label="Lihat foto portrait lebih besar">
        <Image src={portrait} alt="Ilustrasi portrait dengan pencahayaan studio" fill priority sizes="(max-width: 767px) 100vw, 58vw" />
        <span className="studio-photo-caption">Portrait / Editorial <ArrowUpRight size={18} /></span>
      </button>
      <div className="studio-hero-story">
        <p>Foto wisuda, keluarga, pasangan, atau diri sendiri. Pilih paket dan jadwal yang cocok.</p>
        <Link href="/book" className="studio-book-link">Pesan sesi foto <ArrowUpRight size={20} /></Link>
        <a href="#paket" className="studio-text-link">Lihat pilihan paket <ArrowUpRight size={16} /></a>
        <div className="studio-hero-benefits"><span>Ruang privat</span><span>Pencahayaan studio</span><span>File dikirim hari yang sama</span></div>
      </div>
      <PhotoPreview open={preview} onClose={() => setPreview(false)} url={portrait} title="Portrait / Editorial" category="Ilustrasi fotografi studio" />
    </section>
  );
};
