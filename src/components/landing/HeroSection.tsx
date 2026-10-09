import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 sm:pt-20 pb-24 overflow-hidden border-b border-stone-850">
      {/* Subtle warm amber ambient spotlight */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-amber-500/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Editorial Narrative */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-amber-400/30 text-amber-300 text-[11px] font-medium uppercase tracking-[0.22em]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Issue N° 26 • Editorial Haute Portraiture</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-stone-100 tracking-tight leading-[1.08]">
              Abadikan Karakter <br />
              <span className="italic font-normal text-amber-300/95">
                & Cerita Berharga
              </span>{' '}
              Anda.
            </h1>

            <p className="text-base sm:text-lg text-stone-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Studio foto modern dengan pencahayaan sinematik atelier, ruang privasi penuh, dan sistem kurasi jadwal instan bebas antre. Sesi wisuda, potret diri, keluarga, hingga editorial profesional.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/book" className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto">
                  <Calendar className="w-4 h-4" />
                  <span>Reserve Sesi Anda</span>
                </Button>
              </Link>
              <a href="#paket" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <span>Lihat Editions & Rate</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 text-amber-400" />
                </Button>
              </a>
            </div>

            {/* Editorial Features Strip */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-stone-850">
              <div className="text-left space-y-1">
                <span className="text-[11px] font-mono text-amber-400 tracking-wider">01 / PRIVASI</span>
                <p className="text-xs font-semibold text-stone-200">Bebas Bentrok</p>
                <p className="text-[11px] text-stone-400 leading-tight">Jadwal eksklusif terisolasi</p>
              </div>
              <div className="text-left space-y-1">
                <span className="text-[11px] font-mono text-amber-400 tracking-wider">02 / LIGHTING</span>
                <p className="text-xs font-semibold text-stone-200">Color Mastering</p>
                <p className="text-[11px] text-stone-400 leading-tight">Sinematik & jernih</p>
              </div>
              <div className="text-left space-y-1">
                <span className="text-[11px] font-mono text-amber-400 tracking-wider">03 / ARCHIVE</span>
                <p className="text-xs font-semibold text-stone-200">Softcopy Cepat</p>
                <p className="text-[11px] text-stone-400 leading-tight">Drive instan di hari sama</p>
              </div>
            </div>
          </div>

          {/* Right Visual - Editorial Cover Layout */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Asymmetric Offset Border Layer */}
              <div className="absolute -inset-3 rounded-2xl border border-stone-800 -rotate-1 pointer-events-none" />

              <div className="relative z-10 rounded-xl overflow-hidden border border-stone-700/80 shadow-2xl bg-stone-900 aspect-[3/4]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85"
                  alt="Editorial Portrait Atelier Snapbook"
                  className="w-full h-full object-cover filter contrast-[1.05]"
                />
                
                {/* Editorial Vignette & Captions */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent opacity-90" />
                
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-stone-300 font-mono">
                  <span>VOL. 26</span>
                  <span className="text-amber-400 font-bold">COVER STORY</span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-lg bg-[#141211]/90 backdrop-blur-md border border-stone-800/90">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-semibold">
                      Haute Portraiture
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">1/125s • f/2.8</span>
                  </div>
                  <h3 className="font-serif text-lg font-normal text-stone-100 mt-1">
                    Classic Monochrome & Warm Tone
                  </h3>
                  <p className="text-xs text-stone-400 font-light mt-1">
                    Pencahayaan softbox ganda dengan ketajaman warna sinematik.
                  </p>
                </div>
              </div>

              {/* Floating Review Badge */}
              <div className="absolute -bottom-5 -left-4 z-20 bg-[#171513] border border-amber-400/30 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">★★★★★</span>
                  <span className="text-xs font-semibold text-stone-200">4.9 / 5.0</span>
                </div>
                <p className="text-[10px] tracking-wider uppercase text-stone-400 mt-0.5">1.200+ Klien Terkurasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
