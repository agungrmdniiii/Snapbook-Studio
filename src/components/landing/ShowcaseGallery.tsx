'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShowcaseImageItem {
  id: string;
  url: string;
  title?: string | null;
  category: string;
  aspectRatio: string;
}

interface ShowcaseGalleryProps {
  images: ShowcaseImageItem[];
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({ images }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activePhoto, setActivePhoto] = useState<ShowcaseImageItem | null>(null);

  const categories = ['Semua', ...Array.from(new Set(images.map((img) => img.category)))];

  const filteredImages =
    selectedCategory === 'Semua'
      ? images
      : images.filter((img) => img.category === selectedCategory);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePhoto(null);
    };
    if (activePhoto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  return (
    <section id="galeri" className="py-24 sm:py-32 border-b border-neutral-850 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div className="space-y-3 max-w-xl">
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral-100 tracking-tight">
              Galeri Karya Studio
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base font-light">
              Koleksi potret pilihan yang mendokumentasikan ekspresi natural, kehangatan momen, dan karakter otentik setiap klien. Klik foto untuk melihat detail resolusi tinggi.
            </p>
          </div>

          {/* Clean Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                      : 'bg-[#101013] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid - Architectural Museum Aspect */}
        <div
          key={selectedCategory}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 animate-studio-subtle"
        >
          {filteredImages.map((image) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              onClick={() => setActivePhoto(image)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActivePhoto(image);
                }
              }}
              className="group relative rounded-2xl overflow-hidden bg-[#0f0f12] border border-neutral-800/90 hover:border-neutral-500 aspect-[3/4] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 hover:-translate-y-1 hover:shadow-2xl"
            >
              <img
                src={image.url}
                alt={image.title || 'Foto Portofolio Snapbook Studio'}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                loading="lazy"
              />

              {/* View Overlay Tag */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center justify-center shadow-lg">
                  <Eye className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Minimalist Hover Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-5">
                <span className="text-[10px] font-medium text-[#c5a880] uppercase tracking-[0.2em]">
                  {image.category}
                </span>
                <p className="font-serif text-base text-white mt-1">
                  {image.title || 'Studio Portrait'}
                </p>
                <span className="text-[11px] text-neutral-400 font-light mt-1 flex items-center gap-1">
                  <span>Klik untuk detail karya</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Lightbox Exhibition Modal - Always Side-by-Side (Berdampingan) */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 animate-studio-fade">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            onClick={() => setActivePhoto(null)}
          />

          {/* Modal Container: Side-by-side flex-row layout */}
          <div className="relative z-10 w-full max-w-4xl bg-[#101013] border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-row max-h-[88vh]">
            {/* Close Button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-black/75 text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-md transition-colors cursor-pointer shadow-lg"
              aria-label="Tutup pratinjau"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Photo Column (Left Side) */}
            <div className="w-1/2 sm:w-3/5 bg-black/95 flex items-center justify-center p-2 sm:p-6 relative shrink-0 overflow-hidden">
              <img
                src={activePhoto.url}
                alt={activePhoto.title || 'Foto Portofolio Snapbook'}
                className="max-h-[75vh] w-auto h-auto max-w-full object-contain rounded-lg sm:rounded-xl shadow-md"
              />
            </div>

            {/* Curated Details Column (Right Side - Di Samping Foto) */}
            <div className="w-1/2 sm:w-2/5 p-3.5 sm:p-6 md:p-8 flex flex-col justify-between border-l border-neutral-800 overflow-y-auto">
              <div className="space-y-2 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#c5a880]">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{activePhoto.category} Session</span>
                </div>

                <div>
                  <h3 className="font-serif text-base sm:text-2xl md:text-3xl font-normal text-white leading-tight">
                    {activePhoto.title || 'Studio Portrait'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-neutral-400 font-light leading-relaxed mt-1 sm:mt-2 line-clamp-3 sm:line-clamp-none">
                    Dokumentasi profesional dengan tata cahaya 3-point Profoto di studio privat Snapbook. Menghasilkan karakter visual jernih dengan retusir halus natural.
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-neutral-800 text-[10px] sm:text-xs">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Kategori:</span>
                    <span className="text-white font-medium">{activePhoto.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Lokasi:</span>
                    <span className="text-white font-medium">Snapbook Atelier</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Pencahayaan:</span>
                    <span className="text-white font-medium">Profoto Softbox</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Output File:</span>
                    <span className="text-white font-medium">Drive Full Res</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Fotografer:</span>
                    <span className="text-white font-medium">Tim Kreatif Pro</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-5 mt-2 sm:mt-4 border-t border-neutral-800 space-y-1.5 sm:space-y-2.5">
                <Link href="/book" onClick={() => setActivePhoto(null)} className="block w-full">
                  <Button variant="primary" size="md" className="w-full text-xs sm:text-sm py-2 sm:py-2.5">
                    <span>Pesan Sesi Ini</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                  onClick={() => setActivePhoto(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

