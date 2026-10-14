'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  const [activeMood, setActiveMood] = useState<'editorial' | 'noir' | 'warm'>('editorial');
  const [showHeroDetail, setShowHeroDetail] = useState(false);

  const moodStyles = {
    editorial: 'grayscale-[10%] contrast-[1.05] brightness-100',
    noir: 'grayscale contrast-[1.25] brightness-[0.98]',
    warm: 'sepia-[30%] contrast-[1.08] brightness-[1.02]',
  };

  const moodNames = {
    editorial: 'Editorial Clean (Natural)',
    noir: 'Noir B&W (Monochrome High-Contrast)',
    warm: 'Warm Atelier (Golden Hour Tone)',
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHeroDetail(false);
    };
    if (showHeroDetail) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHeroDetail]);

  return (
    <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-28 border-b border-neutral-800/80 animate-studio-fade">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Live Studio Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111115] border border-neutral-800 text-[11px] uppercase tracking-[0.2em] text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span>Studio Buka Hari Ini • Slot Terbatas</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-neutral-100 tracking-tight leading-[1.08]">
              Ruang Fotografi untuk Karakter, Ekspresi, dan Momen Berharga.
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-light leading-relaxed">
              Studio foto profesional dengan tata cahaya sinematik dan privasi penuh. Abadikan momen wisuda, potret diri, kehangatan keluarga, dan pasangan dengan sentuhan estetika abadi.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              <Link href="/book">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Pesan Jadwal Sesi
                </Button>
              </Link>
              <a href="#paket">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <span>Lihat Pilihan Paket</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
            </div>

            {/* Real Studio Values */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 border-t border-neutral-850">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-[0.18em] font-medium text-neutral-200">
                  Privasi Penuh
                </p>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Ruang privat terisolasi, bebas bentrok jadwal.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-[0.18em] font-medium text-neutral-200">
                  Pencahayaan Pro
                </p>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Hasil warna jernih, natural, dan berkarakter.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-[0.18em] font-medium text-neutral-200">
                  Drive Hari Sama
                </p>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Seluruh softcopy original dikirim malam hari.
                </p>
              </div>
            </div>
          </div>

          {/* Right Showcase Visual - Museum Curated Framing with Interactive Mood Switcher */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowHeroDetail(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowHeroDetail(true);
                  }
                }}
                className="group relative overflow-hidden rounded-2xl border border-neutral-800 hover:border-neutral-500 bg-[#0f0f12] aspect-[4/5] shadow-2xl cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85"
                  alt="Portrait Photography Snapbook Studio"
                  className={`w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${moodStyles[activeMood]}`}
                />

                {/* Floating Architectural Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-200 flex items-center gap-1.5 animate-float-subtle">
                  <Sparkles className="w-3 h-3 text-[#c5a880]" />
                  <span>Medium Format • 85mm f/1.4</span>
                </div>

                {/* Eye & Detail Indicator on Hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center justify-center shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Bottom Overlay Hint */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-xs text-neutral-200">
                  <span className="text-[11px] font-light">Klik untuk melihat detail foto</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c5a880]" />
                </div>
              </div>

              {/* Interactive Lighting Tone Switcher */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-full bg-[#111115] border border-neutral-800">
                  {(
                    [
                      { id: 'editorial', label: 'Editorial' },
                      { id: 'noir', label: 'Noir B&W' },
                      { id: 'warm', label: 'Warm Atelier' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMood(m.id)}
                      className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer ${
                        activeMood === m.id
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline">
                  Interactive Tone
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Photo Detail Modal */}
      {showHeroDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-8 animate-studio-fade">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            onClick={() => setShowHeroDetail(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-4xl bg-[#101013] border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] sm:max-h-[88vh] my-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowHeroDetail(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-black/75 text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-md transition-colors cursor-pointer shadow-lg"
              aria-label="Tutup pratinjau"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Photo Column with active mood styling */}
            <div className="w-full md:w-3/5 bg-black/95 flex items-center justify-center p-3 sm:p-6 relative shrink-0 max-h-[38vh] sm:max-h-[46vh] md:max-h-none md:h-auto overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85"
                alt="Portrait Photography Snapbook Studio"
                className={`max-h-[36vh] sm:max-h-[42vh] md:max-h-[75vh] w-auto h-auto max-w-full object-contain rounded-xl shadow-md transition-all duration-500 ${moodStyles[activeMood]}`}
              />
            </div>

            {/* Curated Details Column */}
            <div className="w-full md:w-2/5 p-5 sm:p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-800 overflow-y-auto">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] uppercase tracking-[0.2em] text-[#c5a880]">
                  <Sparkles className="w-3 h-3" />
                  <span>Editorial Cover Portrait</span>
                </div>

                <div>
                  <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-white">
                    Signature Editorial Portrait
                  </h3>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed mt-2">
                    Potret profil editorial dengan pencahayaan Rembrandt klasik dan lensa 85mm f/1.4 untuk pemisahan subjek berkarakter natural.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-neutral-800 text-xs">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Tone Warna:</span>
                    <span className="text-[#c5a880] font-medium">{moodNames[activeMood]}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Kamera & Sensor:</span>
                    <span className="text-white font-medium">Medium Format • 85mm f/1.4</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Tata Cahaya:</span>
                    <span className="text-white font-medium">3-Point Profoto Softbox</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Lokasi:</span>
                    <span className="text-white font-medium">Snapbook Private Atelier</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Output File:</span>
                    <span className="text-white font-medium">Resolusi Penuh + Google Drive</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-neutral-800 space-y-2.5">
                <Link href="/book" onClick={() => setShowHeroDetail(false)} className="block w-full">
                  <Button variant="primary" size="md" className="w-full">
                    <span>Pesan Sesi Foto Ini</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => setShowHeroDetail(false)}
                >
                  Tutup Tampilan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

