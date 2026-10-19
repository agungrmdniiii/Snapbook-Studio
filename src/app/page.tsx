import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';
import { ShowcaseGallery } from '@/components/landing/ShowcaseGallery';
import { PackagesSection } from '@/components/landing/PackagesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { getStudioCatalog } from '@/lib/catalog';

export const revalidate = 60;

export default async function HomePage() {
  let catalog: Awaited<ReturnType<typeof getStudioCatalog>> | null = null;
  try { catalog = await getStudioCatalog(); }
  catch (error) { console.error('Unable to load public catalog:', error); }
  const config = catalog?.config || DEFAULT_CONFIG;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar studioName={config.studioName} openingTime={config.openingTime} closingTime={config.closingTime} />
      <main className="flex-1">
        <HeroSection />
        <MarqueeBanner />
        {catalog ? <><ShowcaseGallery images={catalog.gallery} /><PackagesSection packages={catalog.packages} /></> : (
          <p role="status" className="p-12 text-center text-neutral-300">Katalog studio sementara tidak dapat dimuat. Silakan coba kembali beberapa saat lagi.</p>
        )}
        <FaqSection />
      </main>
      <Footer studioName={config.studioName} address={config.address} whatsappNumber={config.whatsappNumber} instagramHandle={config.instagramHandle} />
    </div>
  );
}
