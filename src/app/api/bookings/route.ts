import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatIDR } from '@/lib/utils';
import { generateBookingWhatsAppUrl } from '@/lib/whatsapp';
import { randomBytes } from 'node:crypto';
import { enforceRateLimit } from '@/lib/rate-limit';
import { BookingValidationError, validateBookingInput, validateSessionTime } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';

export { GET } from './list/route';

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'booking', 10, 900);
  if (limited) return limited;
  try {
    let raw: unknown;
    try { raw = await request.json(); } catch { return NextResponse.json({ error: 'Data reservasi tidak valid.' }, { status: 400 }); }
    const input = validateBookingInput(raw);
    const { packageId, clientName, clientEmail, clientPhone, date, startTime, notes, addOnIds } = input;
    const [pkg, config, addOnRecords] = await Promise.all([
      prisma.package.findUnique({ where: { id: packageId } }),
      prisma.studioConfig.findUnique({ where: { id: 'default' } }),
      prisma.addOn.findMany({ where: { id: { in: addOnIds }, isActive: true } }),
    ]);
    if (!pkg?.isActive) return NextResponse.json({ error: 'Paket tidak tersedia. Silakan pilih paket aktif.' }, { status: 400 });
    if (!config) return NextResponse.json({ error: 'Jadwal studio belum tersedia. Silakan coba kembali.' }, { status: 503 });
    if (addOnRecords.length !== addOnIds.length) return NextResponse.json({ error: 'Salah satu add-on tidak tersedia.' }, { status: 400 });
    const endTime = validateSessionTime(config, pkg.duration, date, startTime);
    const totalPrice = pkg.price + addOnRecords.reduce((sum, addon) => sum + addon.price, 0);
    if (!Number.isSafeInteger(totalPrice) || totalPrice < 0 || totalPrice > 2147483647) throw new BookingValidationError('Harga paket tidak valid.');
    const bookingCode = `SB-${date.replace(/-/g, '')}-${randomBytes(8).toString('hex').toUpperCase()}`;
    const newBooking = await prisma.$transaction(async (tx) => {
      // Serialize writes to the same studio day before checking full session intervals.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${date}, 0))`;
      const collision = await tx.booking.findFirst({ where: {
        date, archivedAt: null, status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { lt: endTime }, endTime: { gt: startTime },
      } });
      if (collision) throw new Error('SLOT_COLLISION');
      // Time may have advanced while waiting for another transaction's lock.
      validateSessionTime(config, pkg.duration, date, startTime);
      return tx.booking.create({ data: {
        bookingCode, packageId: pkg.id, packageNameAtBooking: pkg.name,
        packagePriceAtBooking: pkg.price, packageDurationAtBooking: pkg.duration,
        clientName, clientEmail, clientPhone, date, startTime, endTime,
        status: 'PENDING', totalPrice, notes: notes || null,
        addOns: { create: addOnRecords.map(ad => ({ addOnId: ad.id, priceAtBooking: ad.price })) },
      }, include: { package: true, addOns: { include: { addOn: true } } } });
    });
    const whatsappUrl = generateBookingWhatsAppUrl(config.whatsappNumber, {
      bookingCode: newBooking.bookingCode, clientName: newBooking.clientName,
      packageName: pkg.name, packagePrice: pkg.price, date: newBooking.date,
      startTime: newBooking.startTime, endTime: newBooking.endTime,
      addOns: newBooking.addOns.map(a => `${a.addOn.name} (${formatIDR(a.priceAtBooking)})`),
      totalPrice: newBooking.totalPrice, notes: newBooking.notes || undefined,
    });
    return NextResponse.json({ success: true, booking: newBooking, whatsappUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof BookingValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    const failure = error as { message?: string; code?: string; meta?: unknown };
    if (failure.message === 'SLOT_COLLISION' || failure.code === 'P2002' || failure.code === 'P2034' || (failure.code === 'P2004' && JSON.stringify(failure.meta).includes('23P01'))) {
      return NextResponse.json({ error: 'Slot sesi tersebut baru saja terisi. Silakan pilih jam lain.' }, { status: 409 });
    }
    console.error('Booking creation unavailable', { code: failure.code });
    return NextResponse.json({ error: 'Reservasi belum dapat diproses. Silakan coba kembali.' }, { status: 503 });
  }
}
