'use client';

import React, { useState } from 'react';

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

  const categories = ['Semua', ...Array.from(new Set(images.map((img) => img.category)))];

  const filteredImages =
    selectedCategory === 'Semua'
      ? images
      : images.filter((img) => img.category === selectedCategory);

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
              Koleksi potret pilihan yang mendokumentasikan ekspresi natural, kehangatan momen, dan karakter otentik setiap klien.
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
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-medium'
                      : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid - Architectural Museum Aspect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 aspect-[3/4] transition-all"
            >
              <img
                src={image.url}
                alt={image.title || 'Foto Portofolio Snapbook Studio'}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Minimalist Hover Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-[0.2em]">
                  {image.category}
                </span>
                <p className="font-serif text-base text-white mt-1">
                  {image.title || 'Studio Portrait'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
