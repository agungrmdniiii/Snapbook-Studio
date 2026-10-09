import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeSlots } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Parameter date wajib diisi (YYYY-MM-DD)' }, { status: 400 });
    }

    const config = await prisma.studioConfig.findUnique({ where: { id: 'default' } });
    const openingTime = config?.openingTime || '09:00';
    const closingTime = config?.closingTime || '20:00';
    const slotDuration = config?.slotDuration || 60;

    const allSlots = generateTimeSlots(openingTime, closingTime, slotDuration);

    const activeBookings = await prisma.booking.findMany({
      where: {
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { startTime: true },
    });

    const bookedSlotTimes = new Set(activeBookings.map((b) => b.startTime));

    const slots = allSlots.map((time) => ({
      time,
      available: !bookedSlotTimes.has(time),
    }));

    return NextResponse.json({ date, slots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Gagal mengambil slot waktu' }, { status: 500 });
  }
}
