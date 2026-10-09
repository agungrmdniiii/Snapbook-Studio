import React from 'react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { DEFAULT_CONFIG, DEFAULT_PACKAGES, DEFAULT_ADDONS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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

  const displayConfig = config || DEFAULT_CONFIG;
  const displayPackages = packages && packages.length > 0 ? packages : DEFAULT_PACKAGES;
  const displayAddOns = addOns && addOns.length > 0 ? addOns : DEFAULT_ADDONS;

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar
        studioName={displayConfig.studioName}
        openingTime={displayConfig.openingTime}
        closingTime={displayConfig.closingTime}
      />
      <main className="flex-1">
        <BookingWizard
          packages={displayPackages}
          addOns={displayAddOns}
          initialPackageId={packageId}
        />
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
