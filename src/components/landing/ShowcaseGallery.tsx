'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { PhotoPreview, type PhotoOrigin } from './PhotoPreview';
import { buildGalleryCollection, findPhotoPackage, FAMILY_STORY, type GalleryPhoto } from '@/lib/gallery-presentation';
import { GalleryStory } from './GalleryStory';
interface GalleryPackage { id: string; name: string; category: string; }
export function ShowcaseGallery({ images, packages = [] }: { images: GalleryPhoto[]; packages?: GalleryPackage[] }) {
  const [category, setCategory] = useState('Semua');
  const [selection, setSelection] = useState<{ photos: GalleryPhoto[]; index: number; origin?: PhotoOrigin } | null>(null);
  const collection = buildGalleryCollection(images);
  const categories = ['Semua', ...new Set(collection.map(image => image.category))];
  const visibleImages = collection.filter(image => image.id !== FAMILY_STORY[0].id && (category === 'Semua' || image.category === category));
  const showFamily = category === 'Semua' || category === 'Family';
  const selectedPackage = findPhotoPackage(selection?.photos[selection.index]?.category || '', packages);
  const familyPackage = findPhotoPackage('Family', packages);
  return (
    <section id="galeri" className="studio-gallery">
      <div className="studio-section-heading">
        <h2>Galeri foto.</h2>
        <p>Inspirasi sesi foto. Pilih foto untuk melihat lebih dekat.</p>
      </div>
      <div className="studio-gallery-filters" role="group" aria-label="Kategori galeri">
        {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      {showFamily && <GalleryStory packageId={familyPackage?.id} onOpen={(index, origin) => setSelection({ photos: FAMILY_STORY, index, origin })} />}
      {visibleImages.length ? <div className="studio-gallery-grid">
        {visibleImages.map((image, index) => (
          <button key={image.id} className="studio-gallery-work" onClick={event => { const rect = event.currentTarget.querySelector('.studio-gallery-frame')?.getBoundingClientRect(); setSelection({ photos: visibleImages, index, origin: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : undefined }); }} aria-label={'Lihat ' + (image.title || image.category)}>
            <div className={'studio-gallery-frame ' + (index % 3 === 0 ? 'studio-gallery-frame-tall' : '')}>
              <Image src={image.url} alt={image.title || image.category} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 45vw" unoptimized={!image.url.startsWith('/') && !/^https:\/\/(images\.unsplash\.com\/|[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/gallery\/|whiyncjfocmnatbpknam\.supabase\.co\/storage\/v1\/object\/public\/studio-gallery\/)/.test(image.url)} />
            </div>
            <span className="studio-gallery-caption"><span>{image.title || image.category}<small>{image.category}{image.credit ? ' · Foto stok' : ''}</small></span><ArrowUpRight size={22} /></span>
          </button>
        ))}
      </div> : !showFamily && <p role="status" className="py-10 text-neutral-300">Belum ada foto untuk kategori ini.</p>}
      <PhotoPreview open={!!selection} onClose={() => setSelection(null)} photos={selection?.photos || []} index={selection?.index ?? 0} onIndexChange={index => setSelection(current => current && ({ ...current, index }))} origin={selection?.origin} packageLink={selectedPackage ? { href: `/book?packageId=${encodeURIComponent(selectedPackage.id)}`, label: `Pilih ${selectedPackage.name}` } : undefined} />
    </section>
  );
}
