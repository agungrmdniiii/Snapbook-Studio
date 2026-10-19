import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { withBookedPackage } from '@/lib/booking-view';
import { assertAvailable,audit,scheduleSnapshot,OperationError,operationFailure } from '@/lib/studio-operations';

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
      const current=await tx.booking.findUnique({where:{id}});
      if(!current||current.archivedAt)throw new Error('NOT_FOUND');
      if(current.date!==previous.date)throw new OperationError('Jadwal berubah. Muat ulang reservasi.');
      if (status === 'PENDING' || status === 'CONFIRMED') {
        const config=await tx.studioConfig.findUnique({where:{id:'default'}});
        if(!config)throw new OperationError('Pengaturan studio belum tersedia.',503);
        await assertAvailable(tx,current.date,current.startTime,current.endTime,config.bufferMinutes??0,id);
      }
      const updated=await tx.booking.update({ where: { id }, data: { status }, include: {
        package: true, addOns: { include: { addOn: true } },
      } });
      await audit(tx,session,'BOOKING_STATUS_CHANGED',id,scheduleSnapshot(current),scheduleSnapshot(updated));
      return updated;
    });

    return NextResponse.json({ success: true, booking: withBookedPackage(updated) });
  } catch (error) {
    if(error instanceof OperationError)return operationFailure(error);
    if (error instanceof Error && error.message === 'SLOT_COLLISION') return NextResponse.json({ error: 'Jadwal berbenturan dengan reservasi aktif lain.' }, { status: 409 });
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    console.error('Error updating booking status:', error);
    return operationFailure(error);
  }
}

export const PUT = PATCH;

