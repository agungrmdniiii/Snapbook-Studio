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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        studioName={config?.studioName}
        openingTime={config?.openingTime}
        closingTime={config?.closingTime}
      />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />
        <ShowcaseGallery images={showcaseImages} />
        <PackagesSection packages={packages} />
        <FaqSection />
      </main>
      <Footer
        studioName={config?.studioName}
        address={config?.address}
        whatsappNumber={config?.whatsappNumber}
        instagramHandle={config?.instagramHandle}
      />
    </div>
  );
}
