import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '../src/lib/prisma';
import { GET } from '../src/app/api/bookings/track/route';

const booking = { bookingCode: 'SB-20990102-ABCDEF', clientName: 'Nama Rahasia', clientPhone: '081234567890', clientEmail: 'private@example.test', notes: 'private notes', packageNameAtBooking: 'Paket Lama', packageDurationAtBooking: 90, package: { name: 'Paket Baru', duration: 30 }, addOns: [], date: '2099-01-02', startTime: '09:00', endTime: '10:30', status: 'CONFIRMED', totalPrice: 100000 };
function setup(t: { after: (fn: () => void) => void }) {
  const original = { query: prisma.$queryRaw, booking: prisma.booking.findFirst, config: prisma.studioConfig.findUnique };
  prisma.$queryRaw = (async () => [{ count: 1, resetAt: new Date() }]) as unknown as typeof original.query;
  prisma.booking.findFirst = (async ({ where }: { where: { bookingCode: string; archivedAt: unknown } }) => { assert.equal(where.bookingCode, booking.bookingCode); assert.equal(where.archivedAt, null); return booking; }) as unknown as typeof original.booking;
  prisma.studioConfig.findUnique = (async () => ({ studioName: 'Studio Uji' })) as unknown as typeof original.config;
  t.after(() => { prisma.$queryRaw = original.query; prisma.booking.findFirst = original.booking; prisma.studioConfig.findUnique = original.config; });
}
function request(query: string) { return GET(new Request(`http://localhost/api/bookings/track?${query}`)); }
test('tracking requires both booking code and matching phone', async t => {
  setup(t);
  for (const query of ['query=SB-20990102-ABCDEF', 'phone=081234567890', 'query=081234567890&phone=081234567890']) assert.equal((await request(query)).status, 400);
  const wrong = await request('query=SB-20990102-ABCDEF&phone=089999999999');
  assert.equal(wrong.status, 404);
  const body = await wrong.text();
  assert.equal(body.includes(booking.clientName), false); assert.equal(body.includes(booking.clientPhone), false);
});
test('tracking normalizes phone country codes, returns snapshots, and omits private fields', async t => {
  setup(t);
  const response = await request('query=sb-20990102-abcdef&phone=%2B62%20812%203456%207890');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const body = await response.json();
  assert.equal(body.packageName, 'Paket Lama'); assert.equal(body.packageDuration, 90);
  assert.equal('clientEmail' in body, false); assert.equal('clientPhone' in body, false); assert.equal('notes' in body, false);
});
test('tracking rate limit blocks lookup and returns retry-after', async t => {
  setup(t);
  prisma.$queryRaw = (async () => [{ count: 21, resetAt: new Date(Date.now() + 10000) }]) as unknown as typeof prisma.$queryRaw;
  prisma.booking.findFirst = (async () => { throw new Error('LOOKUP_AFTER_LIMIT'); }) as unknown as typeof prisma.booking.findFirst;
  const response = await request('query=SB-20990102-ABCDEF&phone=081234567890');
  assert.equal(response.status, 429); assert.ok(response.headers.get('Retry-After'));
});
