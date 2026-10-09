import React from 'react';
import Link from 'next/link';
import { Camera, MapPin, Phone, Instagram, Lock } from 'lucide-react';

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
    <footer className="border-t border-stone-850 bg-[#080706] pt-16 pb-12 text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-850">
          {/* Col 1: Brand & Colophon */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-300">
                <Camera className="w-4 h-4 stroke-[1.8]" />
              </div>
              <span className="font-serif text-2xl font-normal text-stone-100 tracking-tight">
                {studioName}
              </span>
            </div>
            <p className="text-stone-400 max-w-sm leading-relaxed font-light text-xs sm:text-sm">
              Atelier fotografi modern untuk mengabadikan momen berharga, potret wisuda, kehangatan keluarga, dan ekspresi estetik Anda dengan pencahayaan sinematik.
            </p>
            <div className="pt-2 text-[10px] uppercase tracking-[0.25em] text-stone-400 font-mono">
              CURATED PRODUCTION • ALL RIGHTS RESERVED
            </div>
          </div>

          {/* Col 2: Navigation Directory */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
              Directory Index
            </p>
            <ul className="space-y-2.5 text-stone-400">
              <li>
                <a href="#galeri" className="hover:text-amber-300 transition-colors uppercase tracking-wider text-[11px]">
                  01. The Archive & Gallery
                </a>
              </li>
              <li>
                <a href="#paket" className="hover:text-amber-300 transition-colors uppercase tracking-wider text-[11px]">
                  02. Editions & Rate Card
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-300 transition-colors uppercase tracking-wider text-[11px]">
                  03. Studio Protocol (FAQ)
                </a>
              </li>
              <li>
                <Link href="/cek-booking" className="hover:text-amber-300 transition-colors uppercase tracking-wider text-[11px]">
                  04. Verifikasi Booking Pass
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Studio Coordinates */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
              Studio Coordinates
            </p>
            <div className="space-y-3 text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-light">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition-colors font-mono"
                >
                  +{whatsappNumber}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Instagram className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono">{instagramHandle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400 font-mono">
          <p>© {new Date().getFullYear()} {studioName}. ATELIER PHOTOGRAPHY SYSTEM.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
            >
              <Lock className="w-3 h-3 text-amber-400/80" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
