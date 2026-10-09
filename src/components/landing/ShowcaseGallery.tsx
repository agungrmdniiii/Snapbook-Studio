'use client';

import React, { useState } from 'react';
import { Sparkles, Camera } from 'lucide-react';

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
    <section id="galeri" className="py-20 border-t border-zinc-900 bg-zinc-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-semibold text-amber-400">
            <Camera className="w-3.5 h-3.5" />
            <span>Portofolio Hasil Foto</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Galeri & Karya Terbaru
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Inspirasi gaya foto, ekspresi bebas, dan kualitas warna studio kami dari berbagai tema favorit.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-lg aspect-[3/4]"
            >
              <img
                src={image.url}
                alt={image.title || 'Foto Portofolio Snapbook Studio'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {image.category}
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {image.title || 'Studio Session'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
