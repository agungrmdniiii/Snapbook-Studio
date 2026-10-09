import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BookingWizard } from '@/components/booking/BookingWizard';

export const dynamic = 'force-dynamic';

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string }>;
}) {
  const { packageId } = await searchParams;

  const [config, packages, addOns] = await Promise.all([
    prisma.studioConfig.findUnique({ where: { id: 'default' } }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.addOn.findMany({
      where: { isActive: true },
    }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar
        studioName={config?.studioName}
        openingTime={config?.openingTime}
        closingTime={config?.closingTime}
      />
      <main className="flex-1">
        <BookingWizard
          packages={packages}
          addOns={addOns}
          initialPackageId={packageId}
        />
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
