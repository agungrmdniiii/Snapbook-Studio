'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { PhotoPreview } from './PhotoPreview';
interface ShowcaseImageItem { id: string; url: string; title?: string | null; category: string; aspectRatio: string; }
export function ShowcaseGallery({ images }: { images: ShowcaseImageItem[] }) {
  const [category, setCategory] = useState('Semua');
  const [photo, setPhoto] = useState<ShowcaseImageItem | null>(null);
  const categories = ['Semua', ...new Set(images.map(image => image.category))];
  const visibleImages = category === 'Semua' ? images : images.filter(image => image.category === category);
  return (
    <section id="galeri" className="studio-gallery">
      <div className="studio-section-heading">
        <h2>Galeri foto.</h2>
        <p>Lihat contoh foto berdasarkan kategori.</p>
      </div>
      <div className="studio-gallery-filters" role="group" aria-label="Kategori galeri">
        {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      {visibleImages.length ? <div className="studio-gallery-grid">
        {visibleImages.map((image, index) => (
          <button key={image.id} className="studio-gallery-work" onClick={() => setPhoto(image)} aria-label={'Lihat ' + (image.title || image.category)}>
            <div className={'studio-gallery-frame ' + (index % 3 === 0 ? 'studio-gallery-frame-tall' : '')}>
              <Image src={image.url} alt={image.title || image.category} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 45vw" unoptimized={!image.url.startsWith('/gallery/') && !/^https:\/\/(images\.unsplash\.com\/|[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/gallery\/|whiyncjfocmnatbpknam\.supabase\.co\/storage\/v1\/object\/public\/studio-gallery\/)/.test(image.url)} />
            </div>
            <span className="studio-gallery-caption"><span>{image.title || 'Studio Portrait'}<small>{image.category}</small></span><ArrowUpRight size={22} /></span>
          </button>
        ))}
      </div> : <p role="status" className="py-10 text-neutral-300">Belum ada foto untuk kategori ini.</p>}
      <PhotoPreview open={!!photo} onClose={() => setPhoto(null)} url={photo?.url || ''} title={photo?.title || 'Studio Portrait'} category={photo?.category || ''} />
    </section>
  );
}
