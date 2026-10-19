import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { BookingValidationError } from '@/lib/scheduling';
import { audit, lockBooking, OperationError, operationFailure, privateHeaders, requiredText, type Tx } from '@/lib/studio-operations';
export const dynamic = 'force-dynamic';
async function summary(tx: Tx, id: string, total: number) {
  const payments = await tx.bookingPayment.findMany({ where: { bookingId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  return { payments, paidAmount, balance: total - paidAmount };
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await getAdminSession()) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    const { id } = await params;
    const result = await prisma.$transaction(async tx => {
      await lockBooking(tx, id);
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking || booking.archivedAt) throw new OperationError('Reservasi tidak ditemukan.', 404);
      return summary(tx, id, booking.totalPrice);
    });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) { return operationFailure(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    const { id } = await params, body = await request.json();
    if (!Number.isInteger(body?.amount) || body.amount <= 0 || body.amount > 2147483647 || !['PAYMENT', 'REFUND'].includes(body.kind) || !['TRANSFER', 'CASH', 'OTHER'].includes(body.method) || typeof body.requestKey!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.requestKey)) throw new BookingValidationError('Jumlah, jenis, metode, atau identitas pembayaran tidak valid.');
    const reference = requiredText(body.reference, 500, true), notes = requiredText(body.notes, 2000, true);
    const result = await prisma.$transaction(async tx => {
      await lockBooking(tx, id);
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking || booking.archivedAt) throw new OperationError('Reservasi tidak ditemukan.', 404);
      const previous = await summary(tx, id, booking.totalPrice);
      const amount = body.kind === 'REFUND' ? -body.amount : body.amount;
      const existing=await tx.bookingPayment.findUnique({where:{requestKey:body.requestKey}});
      if(existing){
        if(existing.bookingId!==id||existing.amount!==amount||existing.method!==body.method||existing.reference!==reference||existing.notes!==notes||existing.recordedById!==actor.id)throw new OperationError('Identitas pembayaran sudah dipakai untuk transaksi lain.');
        return previous;
      }
      const paidAmount = previous.paidAmount + amount;
      if (paidAmount < 0 || paidAmount > booking.totalPrice) throw new OperationError('Pembayaran melebihi tagihan atau pengembalian melebihi jumlah dibayar.');
      const payment = await tx.bookingPayment.create({ data: { requestKey:body.requestKey,bookingId: id, amount, method: body.method, reference, notes, recordedById: actor.id, recordedByUsername: actor.username } });
      await audit(tx, actor, amount > 0 ? 'PAYMENT_RECORDED' : 'REFUND_RECORDED', id, { paidAmount: previous.paidAmount }, { paidAmount, paymentId: payment.id, amount, method: body.method });
      return { payments: [payment, ...previous.payments], paidAmount, balance: booking.totalPrice - paidAmount };
    });
    return NextResponse.json(result, { status: 201, headers: privateHeaders });
  } catch (error) { return operationFailure(error); }
}
