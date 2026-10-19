import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAdminSession } from '@/lib/admin-session';
import { prisma } from '@/lib/prisma';
import { validDate } from '@/lib/scheduling';
import { withBookedPackage } from '@/lib/booking-view';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') ?? 1);
  const requestedSize = Number(params.get('pageSize') ?? 25);
  const status = params.get('status');
  const date = params.get('date');
  const search = params.get('search')?.trim();
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 ||
    !Number.isSafeInteger(requestedSize) || requestedSize < 1 ||
    (status && !['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) ||
    (date && date !== 'ALL' && !validDate(date)) || (search && search.length > 200)) {
    return NextResponse.json({ error: 'Filter reservasi tidak valid' }, { status: 400 });
  }
  const pageSize = Math.min(requestedSize, 50);
  const where: Prisma.BookingWhereInput = { archivedAt: null };
  if (status && status !== 'ALL') where.status = status;
  if (date && date !== 'ALL') where.date = date;
  if (search) where.OR = [
    { bookingCode: { contains: search, mode: 'insensitive' } },
    { clientName: { contains: search, mode: 'insensitive' } },
    { clientPhone: { contains: search, mode: 'insensitive' } },
    { clientEmail: { contains: search, mode: 'insensitive' } },
  ];
  try {
    const [bookings, total, pending, confirmed, completed, revenue] = await Promise.all([
      prisma.booking.findMany({ where, include: { package: true, addOns: { include: { addOn: true } } }, orderBy: [{ date: 'desc' }, { startTime: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { AND: [where, { status: 'PENDING' }] } }),
      prisma.booking.count({ where: { AND: [where, { status: 'CONFIRMED' }] } }),
      prisma.booking.count({ where: { AND: [where, { status: 'COMPLETED' }] } }),
      prisma.booking.aggregate({ where: { AND: [where, { status: { in: ['CONFIRMED', 'COMPLETED'] } }] }, _sum: { totalPrice: true } }),
    ]);
    return NextResponse.json({ bookings: bookings.map(withBookedPackage), total, page, pageSize, stats: { total, pending, confirmed, completed, revenue: revenue._sum.totalPrice ?? 0 } }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ error: 'Data reservasi sementara tidak tersedia' }, { status: 503 });
  }
}
