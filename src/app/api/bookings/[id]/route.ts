import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { withBookedPackage } from '@/lib/booking-view';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
    });

    if (!booking || booking.archivedAt) {
      return NextResponse.json({ error: 'Data booking tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(withBookedPackage(booking), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error fetching booking detail:', error);
    return NextResponse.json({ error: 'Gagal mengambil data booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;

    // Keep the reservation and its price history for recovery/accounting.
    await prisma.booking.update({
      where: { id },
      data: { archivedAt: new Date(), status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Booking berhasil diarsipkan' });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Gagal mengarsipkan booking' }, { status: 500 });
  }
}
