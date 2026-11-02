'use client';
import React, { useEffect, useRef, useId } from 'react';
import { MotionLink as Link } from './PublicMotion';
import { ArrowUpRight, X } from 'lucide-react';
interface PhotoPreviewProps { open: boolean; onClose: () => void; url: string; title: string; category: string; }
export function PhotoPreview({ open, onClose, url, title, category }: PhotoPreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  return (
    <dialog ref={dialog} className="studio-photo-dialog" aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="studio-photo-dialog-content">
        <button type="button" autoFocus onClick={onClose} className="studio-dialog-close" aria-label="Tutup pratinjau"><X size={22} /></button>
        {open && <img src={url} alt={title} />}
        <div className="studio-photo-dialog-info">
          <h2 id={titleId}>{title}</h2><p>{category}</p>
          <Link href="/book" onClick={onClose} className="studio-book-link">Pesan sesi foto <ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </dialog>
  );
}
