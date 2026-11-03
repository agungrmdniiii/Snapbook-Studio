'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MotionLink as Link } from './PublicMotion';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { PhotoPreview } from './PhotoPreview';
import { INSPIRATION_PHOTOS } from '@/lib/gallery-presentation';
export const HeroSection = () => {
  const [preview, setPreview] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [ready, setReady] = useState<string[]>([]);
  const media = useRef<HTMLDivElement>(null);
  const photo = INSPIRATION_PHOTOS[active];
  const playing = !paused && inView && !reducedMotion && !preview;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener('change', syncPreference);
    let visible = true;
    const syncVisibility = () => setInView(visible && !document.hidden);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      syncVisibility();
    }, { threshold: 0.15 }) : null;
    if (media.current) observer?.observe(media.current);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => { observer?.disconnect(); preference.removeEventListener('change', syncPreference); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = (active + 1) % INSPIRATION_PHOTOS.length;
      if (ready.includes(INSPIRATION_PHOTOS[next].id)) setActive(next);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [playing, active, ready]);
  function choose(delta: number) { setPaused(true); setActive(index => (index + delta + INSPIRATION_PHOTOS.length) % INSPIRATION_PHOTOS.length); }
  return (
    <section className="studio-hero studio-cinematic">
      <div className="studio-hero-heading">
        <h1>Foto sendiri,<br /><em>atau bersama.</em></h1>
        <a href="#galeri" className="studio-explore" aria-label="Jelajahi galeri karya"><ArrowDown size={20} /></a>
      </div>
      <div ref={media} className="studio-hero-photo studio-cinematic-media" data-playing={playing}>
        <button type="button" className="studio-cinematic-view" onClick={() => setPreview(true)} aria-label={`Lihat ${photo.title} lebih besar`}>
          {INSPIRATION_PHOTOS.map((item, index) => <span key={item.id} className="studio-cinematic-slide" data-active={active === index} aria-hidden={active !== index}>
            <Image src={item.url} alt={active === index ? `${item.title} — inspirasi fotografi Indonesia` : ''} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 58vw" onLoad={() => setReady(current => current.includes(item.id) ? current : [...current, item.id])} />
          </span>)}
          <span className="studio-cinematic-caption"><span>{photo.title}<small>Inspirasi sesi · Foto stok</small></span><ArrowUpRight size={20} /></span>
        </button>
        <div className="studio-cinematic-controls" aria-label="Kontrol foto pembuka">
          <span className="studio-cinematic-count">{String(active + 1).padStart(2, '0')} <span>/ {String(INSPIRATION_PHOTOS.length).padStart(2, '0')}</span></span>
          <div><button type="button" onClick={() => choose(-1)} aria-label="Inspirasi sebelumnya"><ChevronLeft size={18} /></button>
          {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Putar rangkaian foto' : 'Jeda rangkaian foto'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
          <button type="button" onClick={() => choose(1)} aria-label="Inspirasi berikutnya"><ChevronRight size={18} /></button></div>
        </div>
      </div>
      <div className="studio-hero-story">
        <p>Foto wisuda, keluarga, pasangan, atau diri sendiri. Pilih paket dan jadwal yang cocok.</p>
        <Link href="/book" className="studio-book-link">Pesan sesi foto <ArrowUpRight size={20} /></Link>
        <a href="#paket" className="studio-text-link">Lihat pilihan paket <ArrowUpRight size={16} /></a>
        <div className="studio-hero-benefits"><span>Ruang privat</span><span>Pencahayaan studio</span><span>File dikirim hari yang sama</span></div>
      </div>
      <PhotoPreview open={preview} onClose={() => setPreview(false)} photos={INSPIRATION_PHOTOS} index={active} onIndexChange={index => { setPaused(true); setActive(index); }} />
    </section>
  );
};
