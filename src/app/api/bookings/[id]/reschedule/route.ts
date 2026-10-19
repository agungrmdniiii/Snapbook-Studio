import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { withBookedPackage } from '@/lib/booking-view';
import { BookingValidationError, validateSessionTime } from '@/lib/scheduling';
import { audit, assertAvailable, bookingInclude, lockBooking, lockDates, OperationError, operationFailure, privateHeaders, scheduleSnapshot, activeStatuses } from '@/lib/studio-operations';
export const dynamic = 'force-dynamic';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    const { id } = await params, body = await request.json();
    if (typeof body?.date !== 'string' || typeof body?.startTime !== 'string' || typeof body?.expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(body.expectedUpdatedAt))) throw new BookingValidationError('Tanggal, jam, dan versi reservasi wajib diisi.');
    const booking = await prisma.$transaction(async tx => {
      const initial = await tx.booking.findUnique({ where: { id } });
      if (!initial || initial.archivedAt) throw new OperationError('Reservasi tidak ditemukan.', 404);
      await lockDates(tx, [initial.date, body.date]);
      await lockBooking(tx, id);
      const previous = await tx.booking.findUnique({ where: { id }, include: bookingInclude });
      if (!previous || previous.archivedAt) throw new OperationError('Reservasi tidak ditemukan.', 404);
      if (previous.date !== initial.date || previous.updatedAt.getTime() !== Date.parse(body.expectedUpdatedAt)) throw new OperationError('Reservasi berubah. Muat ulang sebelum menjadwalkan kembali.');
      if (!activeStatuses.includes(previous.status)) throw new OperationError('Hanya reservasi aktif yang dapat dijadwalkan kembali.', 400);
      const config = await tx.studioConfig.findUnique({ where: { id: 'default' } });
      if (!config) throw new OperationError('Pengaturan studio belum tersedia.', 503);
      const duration = previous.packageDurationAtBooking ?? previous.package.duration;
      const endTime = validateSessionTime(config, duration, body.date, body.startTime);
      await assertAvailable(tx, body.date, body.startTime, endTime, config.bufferMinutes, id);
      const updated = await tx.booking.update({ where: { id }, data: { date: body.date, startTime: body.startTime, endTime }, include: bookingInclude });
      await audit(tx, actor, 'BOOKING_RESCHEDULED', id, scheduleSnapshot(previous), scheduleSnapshot(updated));
      return updated;
    });
    return NextResponse.json({ success: true, booking: withBookedPackage(booking) }, { headers: privateHeaders });
  } catch (error) { return operationFailure(error); }
}
