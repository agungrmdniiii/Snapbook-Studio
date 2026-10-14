import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

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

    if (!booking) {
      return NextResponse.json({ error: 'Data booking tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(booking);
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
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;

    // Delete add-ons relation first (in case foreign key cascade isn't configured in older DBs)
    await prisma.bookingAddOn.deleteMany({
      where: { bookingId: id },
    });

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Booking berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menghapus booking' }, { status: 500 });
  }
}
