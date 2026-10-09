'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Fashion Atelier Style */}
          <Link href="/" className="flex flex-col group">
            <span className="font-serif text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-100 group-hover:text-white transition-colors">
              {studioName}
            </span>
            <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-400 font-light -mt-0.5">
              Photo Studio • {openingTime} – {closingTime} WIB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-400">
            <a href="#galeri" className="hover:text-white transition-colors">
              Galeri Karya
            </a>
            <a href="#paket" className="hover:text-white transition-colors">
              Paket Foto
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Panduan
            </a>
            <Link
              href="/cek-booking"
              className="flex items-center gap-1.5 hover:text-white transition-colors text-neutral-300"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Cek Booking</span>
            </Link>
          </nav>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/book">
              <Button variant="primary" size="md">
                Pesan Jadwal
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#09090b] px-6 py-6 space-y-4">
          <a
            href="#galeri"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2"
          >
            Galeri Karya
          </a>
          <a
            href="#paket"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2"
          >
            Paket Foto
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2"
          >
            Panduan & FAQ
          </a>
          <Link
            href="/cek-booking"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cek Status Booking</span>
          </Link>
          <div className="pt-4 border-t border-neutral-800">
            <Link href="/book" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="primary" size="md" className="w-full">
                Pesan Jadwal Sesi
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
