import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function PATCH(
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
    const { status } = await request.json();

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status booking' }, { status: 500 });
  }
}

export const PUT = PATCH;

