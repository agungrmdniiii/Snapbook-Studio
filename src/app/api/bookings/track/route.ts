import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Harap masukkan Kode Booking atau Nomor WhatsApp' }, { status: 400 });
    }

    const sanitizedPhone = sanitizeWhatsAppNumber(query);

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingCode: { equals: query } },
          { clientPhone: { equals: query } },
          { clientPhone: { equals: sanitizedPhone } },
        ],
      },
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reservasi tidak ditemukan. Pastikan kode booking atau nomor WhatsApp sudah benar.' }, { status: 404 });
    }

    const studioConfig = await prisma.studioConfig.findUnique({ where: { id: 'default' } });

    // Return sanitized data
    return NextResponse.json({
      bookingCode: booking.bookingCode,
      clientName: booking.clientName,
      packageName: booking.package.name,
      packageDuration: booking.package.duration,
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
    });
  } catch (error) {
    console.error('Error tracking booking:', error);
    return NextResponse.json({ error: 'Gagal melacak data booking' }, { status: 500 });
  }
}
