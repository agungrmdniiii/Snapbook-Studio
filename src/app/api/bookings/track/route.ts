import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeWhatsAppNumber } from '@/lib/whatsapp';
import { enforceRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, 'booking-track', 20, 900);
  if (limited) return limited;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!query || !phone || query.length > 64 || phone.length > 30 || !/^SB-[A-Z0-9-]+$/i.test(query) || !/^[\d\s()+-]{8,30}$/.test(phone)) {
      return NextResponse.json({ error: 'Masukkan kode booking dan nomor WhatsApp yang digunakan saat memesan.' }, { status: 400 });
    }

    const sanitizedPhone = sanitizeWhatsAppNumber(phone);

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: query.toUpperCase(),
        archivedAt: null,
      },
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!booking || sanitizeWhatsAppNumber(booking.clientPhone) !== sanitizedPhone) {
      return NextResponse.json({ error: 'Reservasi tidak ditemukan. Periksa kode booking dan nomor WhatsApp.' }, { status: 404 });
    }

    const studioConfig = await prisma.studioConfig.findUnique({ where: { id: 'default' } });

    // Return sanitized data
    return NextResponse.json({
      bookingCode: booking.bookingCode,
      clientName: booking.clientName,
      packageName: booking.packageNameAtBooking ?? booking.package.name,
      packageDuration: booking.packageDurationAtBooking ?? booking.package.duration,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      totalPrice: booking.totalPrice,
      addOns: booking.addOns.map((a) => a.addOn.name),
      studio: {
        name: studioConfig?.studioName || 'Snapbook Studio',
        address: studioConfig?.address || '',
        whatsappNumber: studioConfig?.whatsappNumber || '6281234567890',
        instagramHandle: studioConfig?.instagramHandle || '',
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error tracking booking:', error);
    return NextResponse.json({ error: 'Gagal melacak data booking' }, { status: 500 });
  }
}
