'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  const [activeMood, setActiveMood] = useState<'editorial' | 'noir' | 'warm'>('editorial');

  const moodStyles = {
    editorial: 'grayscale-[10%] contrast-[1.05] brightness-100',
    noir: 'grayscale contrast-[1.25] brightness-[0.98]',
    warm: 'sepia-[30%] contrast-[1.08] brightness-[1.02]',
  };

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
              <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f12] aspect-[4/5] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85"
                  alt="Portrait Photography Snapbook Studio"
                  className={`w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] ${moodStyles[activeMood]}`}
                />

                {/* Floating Architectural Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-200 flex items-center gap-1.5 animate-float-subtle">
                  <Sparkles className="w-3 h-3 text-[#c5a880]" />
                  <span>Medium Format • 85mm f/1.4</span>
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
    </section>
  );
};

