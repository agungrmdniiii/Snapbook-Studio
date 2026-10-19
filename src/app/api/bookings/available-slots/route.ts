import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildSlots, BookingValidationError, validDate, wibNow } from '@/lib/scheduling';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '', packageId = searchParams.get('packageId') || '';
  if (!validDate(date) || !packageId || packageId.length > 128) return NextResponse.json({ error: 'Tanggal dan paket wajib dipilih dengan benar.' }, { status: 400 });
  try {
    const [config, pkg, bookings] = await Promise.all([
      prisma.studioConfig.findUnique({ where: { id: 'default' } }),
      prisma.package.findUnique({ where: { id: packageId } }),
      prisma.booking.findMany({ where: { date, archivedAt: null, status: { in: ['PENDING', 'CONFIRMED'] } }, select: { startTime: true, endTime: true } }),
    ]);
    if (!pkg?.isActive) return NextResponse.json({ error: 'Paket tidak tersedia.' }, { status: 400 });
    if (!config) throw new Error('CONFIG_UNAVAILABLE');
    const slots = buildSlots(config, pkg.duration, bookings, date);
    return NextResponse.json({ date, slots, isToday: date === wibNow().date, duration: pkg.duration }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof BookingValidationError) console.error('Studio schedule configuration invalid');
    return NextResponse.json({ error: 'Ketersediaan jadwal belum dapat diperiksa. Silakan coba kembali.' }, { status: 503 });
  }
}
