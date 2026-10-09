'use client';

import React, { useState } from 'react';
import { Camera, Eye } from 'lucide-react';

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
    <section id="galeri" className="py-24 border-b border-stone-850 bg-[#090807]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] font-medium tracking-[0.2em] uppercase text-amber-400">
              <Camera className="w-3.5 h-3.5" />
              <span>The Archive • Series 01</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-stone-100 tracking-tight">
              Galeri & Visual <span className="italic text-amber-300">Lookbook</span>
            </h2>
            <p className="text-stone-400 text-sm sm:text-base font-light">
              Koleksi potret terkurasi dengan eksplorasi emosi, karakter otentik, dan ketajaman warna sinematik.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat, idx) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.15em] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/20'
                      : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {cat === 'Semua' ? 'All Archive' : `${cat}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid - Editorial Frame */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredImages.map((image, idx) => (
            <div
              key={image.id}
              className="group relative rounded-xl overflow-hidden bg-stone-900 border border-stone-800/90 shadow-xl aspect-[3/4] transition-all duration-300 hover:border-amber-400/40"
            >
              <img
                src={image.url}
                alt={image.title || 'Foto Portofolio Snapbook Atelier'}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter contrast-[1.04]"
                loading="lazy"
              />
              
              {/* Top Plate Marker */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-[#0c0a09]/80 backdrop-blur-sm border border-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-300 opacity-80 group-hover:opacity-100 transition-opacity">
                Plate N° {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Bottom Editorial Caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-[0.2em]">
                  {image.category}
                </span>
                <p className="font-serif text-base text-stone-100 mt-1 font-normal">
                  {image.title || 'Untitled Session'}
                </p>
                <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Atelier Archive</span>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
