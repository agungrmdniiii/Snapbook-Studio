import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Instagram, Lock } from 'lucide-react';

interface FooterProps {
  studioName?: string;
  address?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  studioName = 'Snapbook Studio',
  address = 'Jl. Studio Foto No. 10, Jakarta',
  whatsappNumber = '6281234567890',
  instagramHandle = '@snapbookstudio',
}) => {
  return (
    <footer className="border-t border-neutral-800 bg-[#070709] pt-16 sm:pt-20 pb-12 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-neutral-800/80">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-2">
            <span className="font-serif text-2xl font-normal text-white tracking-[0.12em] uppercase block">
              {studioName}
            </span>
            <p className="text-neutral-400 max-w-sm leading-relaxed font-light text-xs sm:text-sm">
              Studio fotografi profesional untuk mengabadikan momen berharga, potret wisuda, kehangatan keluarga, dan ekspresi diri dengan estetika abadi.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-200">
              Navigasi
            </p>
            <ul className="space-y-2.5 text-neutral-400">
              <li>
                <a href="#galeri" className="hover:text-white transition-colors tracking-wide">
                  Galeri Karya
                </a>
              </li>
              <li>
                <a href="#paket" className="hover:text-white transition-colors tracking-wide">
                  Paket & Tarif
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors tracking-wide">
                  Panduan (FAQ)
                </a>
              </li>
              <li>
                <Link href="/cek-booking" className="hover:text-white transition-colors tracking-wide">
                  Cek Status Booking
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Coordinates */}
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-200">
              Lokasi & Kontak
            </p>
            <div className="space-y-3 text-neutral-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-light">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors font-mono"
                >
                  +{whatsappNumber}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Instagram className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="font-mono">{instagramHandle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-light">
          <p>© {new Date().getFullYear()} {studioName}. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Lock className="w-3 h-3 text-neutral-400" />
              <span>Portal Staf</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Luxury Consultation Pill with Pulse Motion */}
      <div className="fixed bottom-6 right-6 z-30 hidden sm:flex items-center">
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            'Halo Snapbook Studio, saya ingin menanyakan jadwal sesi foto...'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111115]/95 hover:bg-[#181820] text-neutral-300 hover:text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium">
            Konsultasi Studio
          </span>
        </a>
      </div>
    </footer>
  );
};
