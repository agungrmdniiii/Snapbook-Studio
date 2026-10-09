import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BookingWizard } from '@/components/booking/BookingWizard';

export const dynamic = 'force-dynamic';

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

const DEFAULT_ADDONS = [
  {
    id: 'addon-extra-print-10r',
    name: 'Ekstra Cetak 10R + Frame Kayu',
    price: 60000,
    description: 'Cetak foto ukuran 10R kualitas lab foto dengan bingkai kayu minimalis.',
    isActive: true,
  },
  {
    id: 'addon-extra-retouch',
    name: 'Ekstra Retouch (5 Foto)',
    price: 50000,
    description: 'Pembersihan kulit halus, perbaikan warna, dan tone estetis.',
    isActive: true,
  },
  {
    id: 'addon-wardrobe',
    name: 'Sewa Toga Wisuda / Jas',
    price: 75000,
    description: 'Sewa jubah wisuda lengkap topi atau set jas formal studio.',
    isActive: true,
  },
];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string }>;
}) {
  const { packageId } = await searchParams;

  let config = null;
  let packages: any[] = [];
  let addOns: any[] = [];

  try {
    [config, packages, addOns] = await Promise.all([
      prisma.studioConfig.findUnique({ where: { id: 'default' } }),
      prisma.package.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.addOn.findMany({
        where: { isActive: true },
      }),
    ]);
  } catch (err) {
    console.error('Database query fallback on BookPage:', err);
  }

  const displayPackages = packages && packages.length > 0 ? packages : DEFAULT_PACKAGES;
  const displayAddOns = addOns && addOns.length > 0 ? addOns : DEFAULT_ADDONS;

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar
        studioName={config?.studioName || 'Snapbook Studio'}
        openingTime={config?.openingTime || '09:00'}
        closingTime={config?.closingTime || '20:00'}
      />
      <main className="flex-1">
        <BookingWizard
          packages={displayPackages}
          addOns={displayAddOns}
          initialPackageId={packageId}
        />
      </main>
      <Footer
        studioName={config?.studioName || 'Snapbook Studio'}
        address={config?.address || 'Jl. Studio Foto No. 10, Jakarta Selatan'}
        whatsappNumber={config?.whatsappNumber || '6281234567890'}
        instagramHandle={config?.instagramHandle || '@snapbookstudio'}
      />
    </div>
  );
}
