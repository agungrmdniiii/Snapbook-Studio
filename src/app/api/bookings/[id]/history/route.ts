import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { operationFailure, privateHeaders } from '@/lib/studio-operations';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await getAdminSession()) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    const { id } = await params;
    if (!await prisma.booking.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    const events = await prisma.auditEvent.findMany({ where: { bookingId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 50 });
    return NextResponse.json({ events }, { headers: privateHeaders });
  } catch (error) { return operationFailure(error); }
}
