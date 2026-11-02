'use client';

import React, { useState, useEffect } from 'react';
import { MotionLink as Link, PublicMotion } from './PublicMotion';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('');

  // Handle smooth scroll when landing with hash on home page
  useEffect(() => {
    if (pathname !== '/') { setActiveSection(''); return; }
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(window.location.hash.slice(1));
      element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    if (!('IntersectionObserver' in window)) return () => cancelAnimationFrame(frame);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setActiveSection(visible.target.id);
      else setActiveSection(current => entries.some(entry => entry.target.id === current) ? '' : current);
    }, { rootMargin: '-81px 0px -65% 0px' });
    ['galeri', 'paket', 'faq'].forEach(id => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [pathname]);

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileMenuOpen(false);

    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        setActiveSection(sectionId);
        el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        if (window.location.hash !== `#${sectionId}`) window.history.pushState(null, '', `/#${sectionId}`);
        const heading = el.querySelector('h2');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
    } else {
      // From any other route (/cek-booking, /book, etc.), navigate reliably to the homepage section
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 transition-all">
      <PublicMotion />
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
              aria-current={activeSection === 'galeri' ? 'location' : undefined}
              onClick={(e) => handleSectionClick(e, 'galeri')}
              className="studio-nav-link hover:text-white transition-colors cursor-pointer"
            >
              Galeri Karya
            </a>
            <a
              href="/#paket"
              aria-current={activeSection === 'paket' ? 'location' : undefined}
              onClick={(e) => handleSectionClick(e, 'paket')}
              className="studio-nav-link hover:text-white transition-colors cursor-pointer"
            >
              Paket Foto
            </a>
            <a
              href="/#faq"
              aria-current={activeSection === 'faq' ? 'location' : undefined}
              onClick={(e) => handleSectionClick(e, 'faq')}
              className="studio-nav-link hover:text-white transition-colors cursor-pointer"
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
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="studio-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div id="studio-mobile-menu" className={`studio-mobile-menu md:hidden ${mobileMenuOpen ? 'is-open' : ''}`} inert={!mobileMenuOpen} aria-hidden={!mobileMenuOpen}>
        <div className="min-h-0 overflow-hidden"><div className="border-b border-neutral-800 bg-[#09090b] px-6 py-6 space-y-4">
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
        </div></div>
      </div>
    </header>
  );
};
