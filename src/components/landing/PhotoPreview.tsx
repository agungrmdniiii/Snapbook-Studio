'use client';
import React, { useEffect, useRef, useId, useState } from 'react';
import { MotionLink as Link } from './PublicMotion';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryPhoto } from '@/lib/gallery-presentation';
export interface PhotoOrigin { left: number; top: number; width: number; height: number; }
interface PhotoPreviewProps {
  open: boolean; onClose: () => void; photos: GalleryPhoto[]; index: number;
  onIndexChange: (index: number) => void; origin?: PhotoOrigin;
  packageLink?: { href: string; label: string };
}
export function PhotoPreview({ open, onClose, photos, index, onIndexChange, origin, packageLink }: PhotoPreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const entered = useRef(false);
  const closing = useRef(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const titleId = useId();
  const photo = photos[index];
  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const previousOverflow = document.body.style.overflow;
    entered.current = false;
    closing.current = false;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  function enter() {
    const node = image.current;
    if (!node || entered.current) return;
    entered.current = true;
    if (!origin || !node.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = node.getBoundingClientRect();
    if (!target.width || !target.height) return;
    const transform = `translate(${origin.left + origin.width / 2 - target.left - target.width / 2}px, ${origin.top + origin.height / 2 - target.top - target.height / 2}px) scale(${origin.width / target.width}, ${origin.height / target.height})`;
    node.animate([{ transform, opacity: 0.5 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function close() {
    if (closing.current) return;
    closing.current = true;
    const node = dialog.current;
    if (!node?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).finished.then(onClose, onClose);
  }
  function move(delta: number) { if (photos.length > 1) onIndexChange((index + delta + photos.length) % photos.length); }
  return (
    <dialog ref={dialog} className="studio-photo-dialog studio-lightbox" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {open && photo && <div className="studio-lightbox-layout">
        <header className="studio-lightbox-header">
          <div><h2 id={titleId}>{photo.title || photo.category}</h2><p aria-live="polite">{index + 1} / {photos.length} · {photo.category}</p></div>
          <button type="button" autoFocus onClick={close} className="studio-lightbox-control" aria-label="Tutup pratinjau"><X size={24} /></button>
        </header>
        <div className="studio-lightbox-stage"
          onTouchStart={event => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; }}
          onTouchEnd={event => { const point = event.changedTouches[0]; const start = touch.current; touch.current = null; if (point && start && Math.abs(point.clientX - start.x) > 50 && Math.abs(point.clientY - start.y) < 80) move(point.clientX < start.x ? 1 : -1); }}>
          {photos.length > 1 && <button type="button" className="studio-lightbox-control studio-lightbox-prev" onClick={() => move(-1)} aria-label="Foto sebelumnya"><ChevronLeft /></button>}
          {failedUrl === photo.url ? <p role="status">Foto tidak dapat dimuat. Coba foto lainnya.</p> : <>
            {loadedUrl !== photo.url && <p role="status" className="studio-lightbox-loading">Memuat foto…</p>}
            <img key={photo.url} ref={image} src={photo.url} alt={photo.title || photo.category} onLoad={() => { setLoadedUrl(photo.url); enter(); }} onError={() => setFailedUrl(photo.url)} />
          </>}
          {photos.length > 1 && <button type="button" className="studio-lightbox-control studio-lightbox-next" onClick={() => move(1)} aria-label="Foto berikutnya"><ChevronRight /></button>}
        </div>
        <footer className="studio-lightbox-footer">
          <div>{photo.credit ? <><span>Foto stok · {photo.credit.location}</span><a href={photo.credit.sourceUrl} target="_blank" rel="noopener noreferrer">Foto: {photo.credit.author} / Pexels <ArrowUpRight size={13} /></a></> : <span>{photo.category}</span>}</div>
          <Link href={packageLink?.href || '/#paket'} onClick={onClose} className="studio-book-link">{packageLink?.label || 'Lihat paket'} <ArrowUpRight size={18} /></Link>
        </footer>
      </div>}
    </dialog>
  );
}
