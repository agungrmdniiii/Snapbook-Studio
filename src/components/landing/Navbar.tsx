'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Handle smooth scroll when landing with hash on home page
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [pathname]);

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `/#${sectionId}`);
      }
    } else {
      // From any other route (/cek-booking, /book, etc.), navigate reliably to the homepage section
      window.location.href = `/#${sectionId}`;
    }
  };

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
            <a
              href="/#galeri"
              onClick={(e) => handleSectionClick(e, 'galeri')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Galeri Karya
            </a>
            <a
              href="/#paket"
              onClick={(e) => handleSectionClick(e, 'paket')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Paket Foto
            </a>
            <a
              href="/#faq"
              onClick={(e) => handleSectionClick(e, 'faq')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Panduan
            </a>
            <Link
              href="/cek-booking"
              className={`flex items-center gap-1.5 transition-colors ${
                pathname === '/cek-booking' ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'
              }`}
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
              className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#09090b] px-6 py-6 space-y-4 animate-studio-fade">
          <a
            href="/#galeri"
            onClick={(e) => handleSectionClick(e, 'galeri')}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2 cursor-pointer"
          >
            Galeri Karya
          </a>
          <a
            href="/#paket"
            onClick={(e) => handleSectionClick(e, 'paket')}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2 cursor-pointer"
          >
            Paket Foto
          </a>
          <a
            href="/#faq"
            onClick={(e) => handleSectionClick(e, 'faq')}
            className="block text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white py-2 cursor-pointer"
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
