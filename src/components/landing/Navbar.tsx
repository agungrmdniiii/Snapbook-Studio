'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Calendar, Menu, X, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  studioName?: string;
  openingTime?: string;
  closingTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  studioName = 'Snapbook Studio',
  openingTime = '09:00',
  closingTime = '20:00',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0c0a09]/85 border-b border-stone-800/80 transition-all">
      {/* Top Editorial Ticker / Masthead Micro-bar */}
      <div className="hidden sm:block border-b border-stone-850/60 bg-[#080706] text-[10px] uppercase tracking-[0.25em] text-stone-400 py-1.5 px-6 text-center">
        <span>Atelier Snapbook • Issue N° 26 • Reservasi Sesi Eksklusif • Jam Operasional {openingTime} – {closingTime} WIB</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Atelier Brand */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-300 group-hover:border-amber-400 transition-colors">
              <Camera className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-100 block group-hover:text-amber-200 transition-colors">
                {studioName}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block -mt-0.5">
                Photography Atelier • Est. 2026
              </span>
            </div>
          </Link>

          {/* Desktop Nav - Editorial Uppercase */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-[0.18em] uppercase text-stone-300">
            <a href="#galeri" className="hover:text-amber-300 transition-colors">
              01. Archive
            </a>
            <a href="#paket" className="hover:text-amber-300 transition-colors">
              02. Editions & Rate
            </a>
            <a href="#faq" className="hover:text-amber-300 transition-colors">
              03. Protocol
            </a>
            <Link
              href="/cek-booking"
              className="flex items-center gap-1.5 text-stone-300 hover:text-amber-300 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Verifikasi Pass</span>
            </Link>
          </nav>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/book">
              <Button variant="gold" size="md">
                <Calendar className="w-4 h-4" />
                <span>Reserve Session</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-900 border border-transparent hover:border-stone-800 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-800 bg-[#0c0a09] px-6 pt-4 pb-8 space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 pb-2 border-b border-stone-900">
            Navigation Index
          </div>
          <a
            href="#galeri"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium tracking-[0.15em] uppercase text-stone-200 hover:text-amber-300 py-1.5"
          >
            01. Archive & Gallery
          </a>
          <a
            href="#paket"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium tracking-[0.15em] uppercase text-stone-200 hover:text-amber-300 py-1.5"
          >
            02. Editions & Rate Card
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium tracking-[0.15em] uppercase text-stone-200 hover:text-amber-300 py-1.5"
          >
            03. Studio Protocol
          </a>
          <Link
            href="/cek-booking"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium tracking-[0.15em] uppercase text-stone-200 hover:text-amber-300 py-1.5"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Verifikasi Booking Pass</span>
          </Link>
          <div className="pt-4 border-t border-stone-900">
            <Link href="/book" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="gold" size="md" className="w-full">
                <Calendar className="w-4 h-4" />
                <span>Reserve Session</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
