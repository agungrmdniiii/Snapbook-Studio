import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeSlots } from '@/lib/utils';
import { DEFAULT_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Parameter date wajib diisi (YYYY-MM-DD)' }, { status: 400 });
    }

    let openingTime = DEFAULT_CONFIG.openingTime;
    let closingTime = DEFAULT_CONFIG.closingTime;
    let slotDuration = DEFAULT_CONFIG.slotDuration;
    let bookedSlotTimes = new Set<string>();

    try {
      const config = await prisma.studioConfig.findUnique({ where: { id: 'default' } });
      if (config) {
        openingTime = config.openingTime || DEFAULT_CONFIG.openingTime;
        closingTime = config.closingTime || DEFAULT_CONFIG.closingTime;
        slotDuration = config.slotDuration || DEFAULT_CONFIG.slotDuration;
      }

      const activeBookings = await prisma.booking.findMany({
        where: {
          date,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { startTime: true },
      });

      bookedSlotTimes = new Set(activeBookings.map((b) => b.startTime));
    } catch (dbError) {
      console.warn('Database query fallback for available-slots:', dbError);
    }

    const allSlots = generateTimeSlots(openingTime, closingTime, slotDuration);

    const slots = allSlots.map((time) => ({
      time,
      available: !bookedSlotTimes.has(time),
    }));

    return NextResponse.json({ date, slots });
  } catch (error) {
    console.error('Error in available-slots route:', error);
    const fallbackSlots = generateTimeSlots(DEFAULT_CONFIG.openingTime, DEFAULT_CONFIG.closingTime, DEFAULT_CONFIG.slotDuration).map((time) => ({
      time,
      available: true,
    }));
    return NextResponse.json({ date: 'selected', slots: fallbackSlots });
  }
}
