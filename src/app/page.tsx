import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';
import { ShowcaseGallery } from '@/components/landing/ShowcaseGallery';
import { PackagesSection } from '@/components/landing/PackagesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG = {
  studioName: 'Snapbook Studio',
  openingTime: '09:00',
  closingTime: '20:00',
  address: 'Jl. Studio Foto No. 10, Jakarta Selatan',
  whatsappNumber: '6281234567890',
  instagramHandle: '@snapbookstudio',
};

const DEFAULT_PACKAGES = [
  {
    id: 'pkg-self-portrait',
    name: 'Self Portrait Express',
    description: 'Sesi self-photo bebas berekspresi tanpa fotografer dengan shutter nirkabel profesional.',
    price: 150000,
    duration: 30,
    category: 'Self Portrait',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    features: JSON.stringify([
      'Hingga 2 orang (tambahan Rp 25rb/orang)',
      '30 menit sesi foto bebas',
      'Semua file digital (softcopy) original',
      '2 foto cetak 4R premium',
      'Berbagai pilihan aksesoris & properti studio',
    ]),
    isActive: true,
  },
  {
    id: 'pkg-graduation',
    name: 'Graduation Special',
    description: 'Paket wisuda elegan dengan fotografer profesional dan pencahayaan studio terbaik.',
    price: 450000,
    duration: 60,
    category: 'Graduation',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    features: JSON.stringify([
      'Hingga 5 orang (wisudawan + keluarga)',
      '60 menit sesi foto terarah',
      '10 foto diedit retouch profesional',
      'Semua softcopy via Google Drive',
      '1 foto cetak 10R + frame minimalis',
    ]),
    isActive: true,
  },
  {
    id: 'pkg-group-family',
    name: 'Family & Group Story',
    description: 'Abadikan kehangatan keluarga besar atau kebersamaan sahabat tersayang.',
    price: 600000,
    duration: 60,
    category: 'Family',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
    features: JSON.stringify([
      'Hingga 8 orang keluarga / sahabat',
      '60 menit sesi foto santai & natural',
      '15 foto diedit retouch resolusi tinggi',
      'Semua file original Google Drive',
      '2 foto cetak 10R bertingkat',
    ]),
    isActive: true,
  },
  {
    id: 'pkg-editorial-creative',
    name: 'Editorial & Commercial',
    description: 'Sesi foto personal branding, lookbook fashion, atau portofolio model dengan creative lighting.',
    price: 950000,
    duration: 90,
    category: 'Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    features: JSON.stringify([
      '1 - 3 orang dengan konsep custom',
      '90 menit sesi foto eksklusif',
      'Creative lighting & backdrop tone',
      '20 foto retouch high-end editorial',
      'Semua RAW & high-res softcopy',
    ]),
    isActive: true,
  },
];

const DEFAULT_GALLERY = [
  {
    id: 'img-1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    title: 'Warm Editorial Portrait',
    category: 'Portrait',
    aspectRatio: 'portrait',
  },
  {
    id: 'img-2',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    title: 'Wisuda Klasik Minimalis',
    category: 'Graduation',
    aspectRatio: 'square',
  },
  {
    id: 'img-3',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
    title: 'Momen Hangat Keluarga',
    category: 'Family',
    aspectRatio: 'landscape',
  },
  {
    id: 'img-4',
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    title: 'Romantic Couple Session',
    category: 'Couple',
    aspectRatio: 'portrait',
  },
  {
    id: 'img-5',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    title: 'Haute Couture Silhouette',
    category: 'Editorial',
    aspectRatio: 'portrait',
  },
  {
    id: 'img-6',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    title: 'Natural Light Aesthetics',
    category: 'Portrait',
    aspectRatio: 'square',
  },
];

export default async function HomePage() {
  let config = null;
  let packages: any[] = [];
  let showcaseImages: any[] = [];

  try {
    [config, packages, showcaseImages] = await Promise.all([
      prisma.studioConfig.findUnique({ where: { id: 'default' } }),
      prisma.package.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.showcaseImage.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
  } catch (err) {
    console.error('Database query fallback on HomePage:', err);
  }

  const displayConfig = config || DEFAULT_CONFIG;
  const displayPackages = packages && packages.length > 0 ? packages : DEFAULT_PACKAGES;
  const displayGallery = showcaseImages && showcaseImages.length > 0 ? showcaseImages : DEFAULT_GALLERY;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        studioName={displayConfig.studioName}
        openingTime={displayConfig.openingTime}
        closingTime={displayConfig.closingTime}
      />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />
        <ShowcaseGallery images={displayGallery} />
        <PackagesSection packages={displayPackages} />
        <FaqSection />
      </main>
      <Footer
        studioName={displayConfig.studioName}
        address={displayConfig.address}
        whatsappNumber={displayConfig.whatsappNumber}
        instagramHandle={displayConfig.instagramHandle}
      />
    </div>
  );
}
