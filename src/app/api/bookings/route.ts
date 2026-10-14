import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { calculateEndTime, formatIDR } from '@/lib/utils';
import { generateBookingWhatsAppUrl } from '@/lib/whatsapp';
import { DEFAULT_CONFIG, DEFAULT_PACKAGES, DEFAULT_ADDONS, getCachedStudioConfig } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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
    const date = searchParams.get('date')?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (date && date !== 'ALL') {
      where.date = date;
    }

    if (search) {
      where.OR = [
        { bookingCode: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
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

    return NextResponse.json(bookings, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json([], { status: 200 });
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

    // Find package in DB or fallback
    let pkg: any = null;
    try {
      pkg = await prisma.package.findUnique({ where: { id: packageId } });
    } catch (err) {
      console.warn('DB lookup failed for package:', err);
    }

    if (!pkg) {
      pkg = DEFAULT_PACKAGES.find((p) => p.id === packageId) || DEFAULT_PACKAGES[0];
    }

    const endTime = calculateEndTime(startTime, pkg.duration);

    // Resolve Add-ons
    let addOnRecords: any[] = [];
    if (addOnIds && addOnIds.length > 0) {
      try {
        addOnRecords = await prisma.addOn.findMany({ where: { id: { in: addOnIds } } });
      } catch (err) {
        addOnRecords = DEFAULT_ADDONS.filter((a) => addOnIds.includes(a.id));
      }
      if (addOnRecords.length === 0) {
        addOnRecords = DEFAULT_ADDONS.filter((a) => addOnIds.includes(a.id));
      }
    }

    let totalPrice = pkg.price;
    for (const addon of addOnRecords) {
      totalPrice += addon.price;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateCode = date.replace(/-/g, '');
    const bookingCode = `SB-${dateCode}-${randomSuffix}`;

    // Prevent double booking collision atomically using Prisma transaction
    const newBooking = await prisma.$transaction(async (tx) => {
      const collision = await tx.booking.findFirst({
        where: {
          date,
          startTime,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (collision) {
        throw new Error('SLOT_COLLISION');
      }

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

    // Studio WhatsApp
    let studioPhone = DEFAULT_CONFIG.whatsappNumber;
    try {
      const studioConfig = await getCachedStudioConfig(prisma);
      if (studioConfig?.whatsappNumber) {
        studioPhone = studioConfig.whatsappNumber;
      }
    } catch (err) {
      // Use fallback phone
    }

    const whatsappUrl = generateBookingWhatsAppUrl(studioPhone, {
      bookingCode: newBooking.bookingCode,
      clientName: newBooking.clientName,
      packageName: newBooking.package?.name || pkg.name,
      packagePrice: newBooking.package?.price || pkg.price,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      addOns: (newBooking.addOns || []).map((a: any) => `${a.addOn?.name || a.name || 'Addon'} (${formatIDR(a.priceAtBooking || 0)})`),
      totalPrice: newBooking.totalPrice,
      notes: newBooking.notes || undefined,
    });

    return NextResponse.json({
      success: true,
      booking: newBooking,
      whatsappUrl,
    });
  } catch (error: any) {
    if (error?.message === 'SLOT_COLLISION') {
      return NextResponse.json(
        { error: 'Maaf, slot jam tersebut baru saja dipesan oleh orang lain. Silakan pilih jam lain.' },
        { status: 409 }
      );
    }
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses reservasi. Silakan periksa kembali data Anda.' },
      { status: 500 }
    );
  }
}
