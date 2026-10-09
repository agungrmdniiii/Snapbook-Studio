import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';
import { ShowcaseGallery } from '@/components/landing/ShowcaseGallery';
import { PackagesSection } from '@/components/landing/PackagesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';
import { DEFAULT_CONFIG, DEFAULT_PACKAGES, DEFAULT_GALLERY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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
