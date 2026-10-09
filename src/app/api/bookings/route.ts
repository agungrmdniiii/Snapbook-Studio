import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { calculateEndTime, formatIDR } from '@/lib/utils';
import { generateBookingWhatsAppUrl } from '@/lib/whatsapp';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { bookingCode: { contains: search } },
        { clientName: { contains: search } },
        { clientPhone: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Gagal mengambil data booking' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, clientName, clientEmail, clientPhone, date, startTime, addOnIds, notes } = body;

    if (!packageId || !clientName || !clientPhone || !date || !startTime) {
      return NextResponse.json(
        { error: 'Harap lengkapi semua data wajib (paket, nama, no HP, tanggal, dan jam).' },
        { status: 400 }
      );
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: 'Paket foto tidak ditemukan' }, { status: 404 });
    }

    const endTime = calculateEndTime(startTime, pkg.duration);

    // Atomic transaction to prevent double booking
    const newBooking = await prisma.$transaction(async (tx) => {
      const collision = await tx.booking.findFirst({
        where: {
          date,
          startTime,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (collision) {
        throw new Error('SLOT_TAKEN');
      }

      let totalPrice = pkg.price;
      const addOnRecords =
        addOnIds && addOnIds.length > 0
          ? await tx.addOn.findMany({ where: { id: { in: addOnIds } } })
          : [];

      for (const addon of addOnRecords) {
        totalPrice += addon.price;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateCode = date.replace(/-/g, '');
      const bookingCode = `SB-${dateCode}-${randomSuffix}`;

      return await tx.booking.create({
        data: {
          bookingCode,
          packageId: pkg.id,
          clientName: clientName.trim(),
          clientEmail: (clientEmail || '').trim(),
          clientPhone: clientPhone.trim(),
          date,
          startTime,
          endTime,
          status: 'PENDING',
          totalPrice,
          notes: notes ? notes.trim() : null,
          addOns: {
            create: addOnRecords.map((ad) => ({
              addOnId: ad.id,
              priceAtBooking: ad.price,
            })),
          },
        },
        include: {
          package: true,
          addOns: { include: { addOn: true } },
        },
      });
    });

    const studioConfig = await prisma.studioConfig.findUnique({ where: { id: 'default' } });
    const studioPhone = studioConfig?.whatsappNumber || '6281234567890';

    const whatsappUrl = generateBookingWhatsAppUrl(studioPhone, {
      bookingCode: newBooking.bookingCode,
      clientName: newBooking.clientName,
      packageName: newBooking.package.name,
      packagePrice: newBooking.package.price,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      addOns: newBooking.addOns.map((a) => `${a.addOn.name} (${formatIDR(a.priceAtBooking)})`),
      totalPrice: newBooking.totalPrice,
      notes: newBooking.notes || undefined,
    });

    return NextResponse.json({
      success: true,
      booking: newBooking,
      whatsappUrl,
    });
  } catch (error: any) {
    if (error.message === 'SLOT_TAKEN') {
      return NextResponse.json(
        { error: 'Maaf, slot jam tersebut baru saja dipesan oleh orang lain. Silakan pilih jam lain.' },
        { status: 409 }
      );
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Gagal membuat reservasi' }, { status: 500 });
  }
}
