import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { withBookedPackage } from '@/lib/booking-view';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.booking.findUnique({ where: { id } });
      if (!previous || previous.archivedAt) throw new Error('NOT_FOUND');
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${previous.date}, 0))`;
      if (status === 'PENDING' || status === 'CONFIRMED') {
        const collision = await tx.booking.findFirst({ where: {
          id: { not: id }, date: previous.date, archivedAt: null,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { lt: previous.endTime }, endTime: { gt: previous.startTime },
        } });
        if (collision) throw new Error('SLOT_COLLISION');
      }
      return tx.booking.update({ where: { id }, data: { status }, include: {
        package: true, addOns: { include: { addOn: true } },
      } });
    });

    return NextResponse.json({ success: true, booking: withBookedPackage(updated) });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_COLLISION') return NextResponse.json({ error: 'Jadwal berbenturan dengan reservasi aktif lain.' }, { status: 409 });
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status booking' }, { status: 500 });
  }
}

export const PUT = PATCH;

