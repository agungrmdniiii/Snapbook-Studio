'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Calendar, Clock, Menu, X, Search } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                {studioName}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Buka {openingTime} - {closingTime} WIB</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#galeri" className="hover:text-amber-400 transition-colors">
              Galeri Foto
            </a>
            <a href="#paket" className="hover:text-amber-400 transition-colors">
              Paket & Harga
            </a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
            <Link
              href="/cek-booking"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Cek Booking</span>
            </Link>
          </nav>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/book">
              <Button size="md" className="shadow-amber-500/25">
                <Calendar className="w-4 h-4" />
                <span>Booking Sekarang</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 pt-2 pb-6 space-y-3">
          <a
            href="#galeri"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-300 hover:bg-zinc-900"
          >
            Galeri Foto
          </a>
          <a
            href="#paket"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-300 hover:bg-zinc-900"
          >
            Paket & Harga
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-300 hover:bg-zinc-900"
          >
            FAQ
          </a>
          <Link
            href="/cek-booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-medium text-zinc-300 hover:bg-zinc-900"
          >
            Cek Status Booking
          </Link>
          <div className="pt-2">
            <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">
                <Calendar className="w-4 h-4" />
                <span>Booking Sekarang</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
