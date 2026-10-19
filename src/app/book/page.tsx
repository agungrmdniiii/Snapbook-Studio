import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { getStudioCatalog } from '@/lib/catalog';

export default async function BookPage({ searchParams }: { searchParams: Promise<{ packageId?: string }> }) {
  const { packageId } = await searchParams;
  let catalog: Awaited<ReturnType<typeof getStudioCatalog>> | null = null;
  try { catalog = await getStudioCatalog(); }
  catch (error) { console.error('Unable to load booking catalog:', error); }
  const config = catalog?.config || DEFAULT_CONFIG;
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar studioName={config.studioName} openingTime={config.openingTime} closingTime={config.closingTime} />
      <main className="flex-1">
        {catalog?.config && catalog.packages.length > 0 ? (
          <BookingWizard packages={catalog.packages} addOns={catalog.addOns} initialPackageId={packageId} />
        ) : (
          <div role="status" className="max-w-xl mx-auto px-6 py-24 text-center text-neutral-300">
            <p>{catalog?.config ? 'Belum ada paket yang tersedia untuk dipesan.' : 'Katalog booking sementara tidak dapat dimuat. Silakan coba kembali beberapa saat lagi.'}</p>
            <a href="/book" className="inline-block mt-5 underline">Muat ulang</a>
          </div>
        )}
      </main>
      <Footer studioName={config.studioName} address={config.address} whatsappNumber={config.whatsappNumber} instagramHandle={config.instagramHandle} />
    </div>
  );
}
