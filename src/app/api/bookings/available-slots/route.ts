import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeSlots } from '@/lib/utils';
import { DEFAULT_CONFIG, getCachedStudioConfig } from '@/lib/constants';

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
      const [config, activeBookings] = await Promise.all([
        getCachedStudioConfig(prisma),
        prisma.booking.findMany({
          where: {
            date,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { startTime: true },
        }),
      ]);

      if (config) {
        openingTime = config.openingTime || DEFAULT_CONFIG.openingTime;
        closingTime = config.closingTime || DEFAULT_CONFIG.closingTime;
        slotDuration = config.slotDuration || DEFAULT_CONFIG.slotDuration;
      }

      bookedSlotTimes = new Set(activeBookings.map((b) => b.startTime));
    } catch (dbError) {
      console.warn('Database query fallback for available-slots:', dbError);
    }

    const nowWibDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const nowWibTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());

    const isToday = date === nowWibDate;

    const allSlots = generateTimeSlots(openingTime, closingTime, slotDuration);

    const slots = allSlots.map((time) => {
      const isPast = isToday && time <= nowWibTime;
      const isBooked = bookedSlotTimes.has(time);
      return {
        time,
        available: !isPast && !isBooked,
        isPast,
      };
    });

    return NextResponse.json({ date, slots, isToday });
  } catch (error) {
    console.error('Error in available-slots route:', error);
    const fallbackSlots = generateTimeSlots(DEFAULT_CONFIG.openingTime, DEFAULT_CONFIG.closingTime, DEFAULT_CONFIG.slotDuration).map((time) => ({
      time,
      available: true,
      isPast: false,
    }));
    return NextResponse.json({ date: 'selected', slots: fallbackSlots });
  }
}
