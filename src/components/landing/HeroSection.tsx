import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modern Editorial & Self Photo Studio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Abadikan Momen <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Paling Berharga
              </span>{' '}
              Anda.
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Studio foto profesional dengan pencahayaan sinematik, privasi penuh, dan sistem booking instan tanpa antre panjang. Wisuda, potret diri, keluarga, hingga pasangan.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/book" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  <Calendar className="w-5 h-5" />
                  <span>Pesan Jadwal Sekarang</span>
                </Button>
              </Link>
              <a href="#paket" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <span>Lihat Paket & Harga</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>

            {/* Value Highlights */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-zinc-800/80">
              <div className="flex items-center gap-2.5 text-left">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-200">Bebas Bentrok</p>
                  <p className="text-[11px] text-zinc-500">Slot jadwal terisolasi</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-left">
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-200">Softcopy Cepat</p>
                  <p className="text-[11px] text-zinc-500">Drive instan hari yang sama</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-left">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-200">Pro Lighting</p>
                  <p className="text-[11px] text-zinc-500">Hasil jernih & berkarakter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative z-10 rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl shadow-black/80 aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                  alt="Snapbook Studio Portrait"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80">
                  <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Featured Sesi</p>
                  <p className="text-sm font-bold text-white mt-0.5">Classic Editorial Portrait</p>
                  <p className="text-xs text-zinc-400">Pencahayaan softbox ganda dengan warna natural</p>
                </div>
              </div>

              {/* Decorative Floating badge */}
              <div className="absolute -top-4 -right-4 z-20 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-sm hidden sm:block">
                <p className="text-xs font-semibold text-zinc-200">⭐ Rating 4.9/5</p>
                <p className="text-[10px] text-zinc-400">1.200+ Klien Puas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
