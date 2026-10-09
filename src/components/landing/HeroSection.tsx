import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-28 border-b border-neutral-800/80 animate-studio-fade">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-neutral-100 tracking-tight leading-[1.08]">
              Ruang Fotografi untuk Karakter, Ekspresi, dan Momen Berharga.
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-light leading-relaxed">
              Studio foto profesional dengan tata cahaya sinematik dan privasi penuh. Abadikan momen wisuda, potret diri, kehangatan keluarga, dan pasangan dengan sentuhan estetika abadi.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
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
            <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 border-t border-neutral-850">
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

          {/* Right Showcase Visual - Museum Curated Framing */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0f0f12] aspect-[4/5] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85"
                  alt="Portrait Photography Snapbook Studio"
                  className="w-full h-full object-cover grayscale-[12%] contrast-[1.04] hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:hover:scale-100"
                />
              </div>

              {/* Minimalist Understated Caption */}
              <div className="mt-3.5 flex items-center justify-between text-[11px] text-neutral-400 font-light tracking-wide">
                <span>Studio Portrait Session</span>
                <span className="font-mono text-neutral-400">Jakarta Studio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
