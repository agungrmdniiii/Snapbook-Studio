'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';

const clips = [
  { id: 'camera', title: 'Detail kamera', source: 'Mixkit', href: 'https://mixkit.co/free-stock-video/close-shot-on-a-dslr-camera-44076/', alt: 'Ilustrasi kamera di studio dengan cahaya redup' },
  { id: 'lighting', title: 'Ruang & cahaya', source: 'PLAYBOX STUDIO / Pexels', href: 'https://www.pexels.com/video/empty-photography-studio-with-lighting-equipment-35055560/', alt: 'Ilustrasi ruang studio kosong dengan perlengkapan pencahayaan' },
];

export function StudioFilm() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [autoAllowed, setAutoAllowed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const clip = clips[active];
  const shouldPlay = inView && !stopped && (autoAllowed || requested);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const syncPreference = () => {
      setAutoAllowed(!preference.matches && !connection?.saveData);
      if (preference.matches || connection?.saveData) setRequested(false);
    };
    syncPreference();
    preference.addEventListener('change', syncPreference);
    let visible = false;
    const syncVisibility = () => setInView(visible && !document.hidden);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      syncVisibility();
    }, { threshold: 0.3 }) : null;
    if (frame.current) observer?.observe(frame.current);
    setFullscreen(typeof frame.current?.requestFullscreen === 'function');
    const syncFullscreen = () => setExpanded(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => { observer?.disconnect(); preference.removeEventListener('change', syncPreference); document.removeEventListener('fullscreenchange', syncFullscreen); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node) return;
    let disposed = false;
    if (shouldPlay && !failed) node.play().catch(() => { if (!disposed) { setPlaying(false); setStopped(true); setRequested(false); } });
    else node.pause();
    return () => { disposed = true; node.pause(); };
  }, [active, shouldPlay, failed]);

  function toggle() {
    if (playing) { setStopped(true); setRequested(false); }
    else {
      const node = video.current;
      if (failed) { node?.load(); setFailed(false); }
      setStopped(false); setRequested(true);
      node?.play().catch(() => { if (video.current === node) setPlaying(false); });
    }
  }
  function select(index: number) {
    if (index === active) return;
    setReady(false); setFailed(false); setPlaying(false); setActive(index);
  }

  return <figure className="studio-film">
    <div className="studio-film-options" role="group" aria-label="Video suasana studio">
      {clips.map((item, index) => <button key={item.id} type="button" aria-pressed={active === index} onClick={() => select(index)}>{item.title}</button>)}
    </div>
    <div ref={frame} className="studio-film-frame">
      <Image src={`/studio-media/${clip.id}.webp`} alt={clip.alt} fill sizes="(max-width: 767px) 100vw, 90vw" />
      <video key={clip.id} ref={video} className="studio-film-video" data-ready={ready && !failed} src={`/studio-media/${clip.id}.mp4`} poster={`/studio-media/${clip.id}.webp`} preload="none" muted loop playsInline aria-label={clip.alt}
        onLoadedData={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
      <div className="studio-film-overlay"><span>Ilustrasi suasana studio · Video stok</span><div>
        {fullscreen && <button type="button" onClick={() => { const operation = document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen(); operation?.catch(() => {}); }} aria-label={expanded ? 'Keluar layar penuh video' : 'Layar penuh video'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>}
        <button type="button" onClick={toggle} aria-label={failed ? 'Coba putar video lagi' : playing ? 'Jeda video studio' : 'Putar video studio'}>{failed ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}<span>{failed ? 'Coba lagi' : playing ? 'Jeda' : 'Putar'}</span></button>
      </div></div>
    </div>
    <figcaption><span role={failed ? 'status' : undefined}>{failed ? 'Video belum dapat diputar. Coba lagi atau pilih video lainnya.' : 'Materi ilustrasi untuk melihat persiapan pemotretan.'}</span><a href={clip.href} target="_blank" rel="noopener noreferrer">Sumber: {clip.source} <ArrowUpRight size={13} /></a></figcaption>
  </figure>;
}
