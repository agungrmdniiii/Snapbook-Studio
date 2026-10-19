import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { BookingValidationError, minuteTime, timeMinutes } from './scheduling';

export type Tx = Prisma.TransactionClient;
export const activeStatuses = ['PENDING', 'CONFIRMED'];
export const bookingInclude = { package: true, addOns: { include: { addOn: true } } } as const;
export const privateHeaders = { 'Cache-Control': 'private, no-store' };
export class OperationError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export function operationFailure(error: unknown) {
  if (error instanceof BookingValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error instanceof SyntaxError ? 'Data tidak valid.' : error.message }, { status: 400 });
  if (error instanceof OperationError) return NextResponse.json({ error: error.message }, { status: error.status });
  const failure = (error ?? {}) as { code?: string; meta?: unknown };
  const collision = failure.code === 'P2034' || ((failure.code === 'P2004' || failure.code === 'P2010') && JSON.stringify(failure.meta ?? {}).includes('23P01'));
  return NextResponse.json({ error: collision ? 'Jadwal berbenturan. Muat ulang dan pilih jadwal lain.' : 'Layanan sementara tidak tersedia.' }, { status: collision ? 409 : 503 });
}
type CalendarBooking = { id: string; date: string; startTime: string; endTime: string; status: string; archivedAt?: Date | null };
type CalendarBlock = { date: string; startTime: string; endTime: string };
export function conflictIds(bookings: CalendarBooking[], blocks: CalendarBlock[], buffer: number) {
  const active=bookings.filter(b=>!b.archivedAt&&activeStatuses.includes(b.status));
  const ids=new Set<string>();
  for(let i=0;i<active.length;i++) {
    const a=active[i],start=timeMinutes(a.startTime),end=timeMinutes(a.endTime)+buffer;
    if(blocks.some(b=>b.date===a.date&&timeMinutes(b.startTime)<end&&timeMinutes(b.endTime)>start)) ids.add(a.id);
    for(let j=i+1;j<active.length;j++) {
      const b=active[j];
      if(a.date===b.date&&timeMinutes(b.startTime)<end&&timeMinutes(b.endTime)+buffer>start){ids.add(a.id);ids.add(b.id);}
    }
  }
  return ids;
}
export async function lockDates(tx: Tx, dates: string[]) {
  for (const date of [...new Set(dates)].sort()) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${date}, 0))`;
}
export async function lockBooking(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
}
export function scheduleSnapshot(b: { date: string; startTime: string; endTime: string; status: string; archivedAt?: Date | null }) {
  return { date: b.date, startTime: b.startTime, endTime: b.endTime, status: b.status, archivedAt: b.archivedAt?.toISOString() ?? null };
}
export async function audit(tx: Tx, actor: { id: string; username: string }, action: string, bookingId: string | null, before?: Prisma.InputJsonValue, after?: Prisma.InputJsonValue) {
  await tx.auditEvent.create({ data: { actorId: actor.id, actorUsername: actor.username, action, bookingId, ...(before === undefined ? {} : { before }), ...(after === undefined ? {} : { after }) } });
}
export async function assertAvailable(tx: Tx, date: string, startTime: string, endTime: string, buffer: number, excludeId?: string) {
  const collision = await tx.booking.findFirst({ where: {
    ...(excludeId ? { id: { not: excludeId } } : {}), date, archivedAt: null,
    status: { in: activeStatuses }, startTime: { lt: minuteTime(Math.min(1440, timeMinutes(endTime) + buffer)) }, endTime: { gt: minuteTime(Math.max(0, timeMinutes(startTime) - buffer)) },
  } });
  if (collision) throw new OperationError('Jadwal berbenturan dengan reservasi aktif lain.');
  const block = await tx.scheduleBlock.findFirst({ where: { date, startTime: { lt: minuteTime(Math.min(1440, timeMinutes(endTime) + buffer)) }, endTime: { gt: startTime } } });
  if (block) throw new OperationError('Jadwal ditutup oleh studio.');
}
export function requiredText(value: unknown, max: number, optional = false) {
  if ((value === undefined || value === null) && optional) return null;
  if (typeof value !== 'string' || value.trim().length > max || (!optional && !value.trim())) throw new BookingValidationError('Teks tidak valid.');
  return value.trim() || null;
}
