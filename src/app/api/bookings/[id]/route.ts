import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { withBookedPackage } from '@/lib/booking-view';
import { audit,lockDates,scheduleSnapshot,OperationError,operationFailure } from '@/lib/studio-operations';

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

    await prisma.$transaction(async tx=>{
      const b=await tx.booking.findUnique({where:{id}});if(!b||b.archivedAt)throw new OperationError('Reservasi tidak ditemukan.',404);
      await lockDates(tx,[b.date]);
      const current=await tx.booking.findUnique({where:{id}});if(!current||current.archivedAt)throw new OperationError('Reservasi tidak ditemukan.',404);
      if(current.date!==b.date)throw new OperationError('Jadwal berubah. Muat ulang reservasi.');
      const updated=await tx.booking.update({where:{id},data:{archivedAt:new Date(),status:'CANCELLED'}});
      await audit(tx,session,'BOOKING_ARCHIVED',id,scheduleSnapshot(current),scheduleSnapshot(updated));
    });

    return NextResponse.json({ success: true, message: 'Booking berhasil diarsipkan' });
  } catch (error: any) {
    if(error instanceof OperationError)return operationFailure(error);
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Gagal mengarsipkan booking' }, { status: 500 });
  }
}
