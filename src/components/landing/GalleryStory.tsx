'use client';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { FAMILY_STORY } from '@/lib/gallery-presentation';
import { MotionLink } from './PublicMotion';
import type { PhotoOrigin } from './PhotoPreview';

export function GalleryStory({ onOpen, packageId }: { onOpen: (index: number, origin?: PhotoOrigin) => void; packageId?: string }) {
  return <article className="studio-gallery-story" aria-labelledby="family-story-title">
    <div className="studio-story-photos">
      {FAMILY_STORY.map((photo, index) => <button type="button" key={photo.id} className={`studio-story-photo studio-story-photo-${index}`} aria-label={`Buka koleksi keluarga, foto ${index + 1} dari 3`} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); onOpen(index, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }); }}>
        <Image src={photo.url} alt={photo.title || 'Foto keluarga'} fill sizes="(max-width: 767px) 60vw, 40vw" />
        <span>{String(index + 1).padStart(2, '0')} <ArrowUpRight size={16} /></span>
      </button>)}
    </div>
    <div className="studio-story-info"><h3 id="family-story-title">Foto keluarga.</h3><p>Tiga foto dari koleksi Philip Elma di Malang.</p><span className="studio-story-credit">Koleksi inspirasi · Foto stok</span>
      <button type="button" onClick={() => onOpen(0)} className="studio-text-link">Lihat 3 foto <ArrowUpRight size={18} /></button>
      {packageId && <MotionLink href={`/book?packageId=${encodeURIComponent(packageId)}`} className="studio-book-link">Pilih paket keluarga <ArrowUpRight size={18} /></MotionLink>}
    </div>
  </article>;
}
