import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';
import { ShowcaseGallery } from '@/components/landing/ShowcaseGallery';
import { PackagesSection } from '@/components/landing/PackagesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function HomePage() {
  const [config, packages, showcaseImages] = await Promise.all([
    prisma.studioConfig.findUnique({ where: { id: 'default' } }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.showcaseImage.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

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
