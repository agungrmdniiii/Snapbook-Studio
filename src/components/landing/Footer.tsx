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
    <footer className="border-t border-zinc-900 bg-zinc-950 pt-16 pb-12 text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-850 border-zinc-900">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {studioName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
              Studio foto modern untuk mengabadikan momen berharga, potret wisuda, kehangatan keluarga, dan ekspresi bebas Anda.
            </p>
          </div>

          {/* Col 2: Nav Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Navigasi Cepat
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#galeri" className="hover:text-amber-400 transition-colors">
                  Portofolio Galeri
                </a>
              </li>
              <li>
                <a href="#paket" className="hover:text-amber-400 transition-colors">
                  Paket & Harga
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors">
                  Tanya Jawab (FAQ)
                </a>
              </li>
              <li>
                <Link href="/cek-booking" className="hover:text-amber-400 transition-colors">
                  Cek Status Booking
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Location */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Lokasi & Kontak
            </p>
            <div className="space-y-2.5 text-xs sm:text-sm text-zinc-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  +{whatsappNumber}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{instagramHandle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {studioName}. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
