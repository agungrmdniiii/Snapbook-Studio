import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '../src/lib/prisma';
import { POST } from '../src/app/api/bookings/route';
import { GET as availableSlots } from '../src/app/api/bookings/available-slots/route';

const input = { packageId: 'real', clientName: 'Nama Uji', clientPhone: '081234567890', date: '2099-01-02', startTime: '10:00' };
const config = { openingTime: '09:00', closingTime: '20:00', slotDuration: 60, whatsappNumber: '6281234567890' };
const pkg = { id: 'real', name: 'Paket Uji', price: 100000, duration: 90, isActive: true };
function setup(t: { after: (fn: () => void) => void }) {
  const restore: (() => void)[] = [];
  function replace(object: object, key: string, value: unknown) {
    const target = object as Record<string, unknown>, previous = target[key];
    target[key] = value; restore.push(() => { target[key] = previous; });
  }
  t.after(() => restore.reverse().forEach(fn => fn()));
  replace(prisma, '$queryRaw', async () => [{ count: 1, resetAt: new Date() }]);
  replace(prisma.package, 'findUnique', async () => pkg);
  replace(prisma.studioConfig, 'findUnique', async () => config);
  replace(prisma.addOn, 'findMany', async () => []);
  // Every transaction is explicitly mocked; no test can write the real database.
  replace(prisma, '$transaction', async () => { throw new Error('UNEXPECTED_TRANSACTION'); });
  return replace;
}
const request = (data: unknown) => new Request('http://localhost/api/bookings', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });

test('new booking locks its day before checking full overlaps and returns 409', async t => {
  const replace = setup(t), events: string[] = [];
  replace(prisma, '$transaction', async (run: (tx: unknown) => Promise<unknown>) => run({
    $executeRaw: async (_sql: unknown, day: string) => { events.push('lock'); assert.equal(day, input.date); },
    booking: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        events.push('check'); assert.deepEqual(where.startTime, { lt: '11:30' });
        assert.deepEqual(where.endTime, { gt: '10:00' }); assert.equal(where.archivedAt, null);
        return { startTime: '09:00', endTime: '10:30' };
      },
      create: async () => { throw new Error('OVERLAP_WAS_SAVED'); },
    },
  }));
  assert.equal((await POST(request(input))).status, 409);
  assert.deepEqual(events, ['lock', 'check']);
});
test('inactive or missing packages and nonexistent add-ons are rejected without defaults', async t => {
  const replace = setup(t);
  replace(prisma.package, 'findUnique', async () => null);
  assert.equal((await POST(request(input))).status, 400);
  replace(prisma.package, 'findUnique', async () => ({ ...pkg, isActive: false }));
  assert.equal((await POST(request(input))).status, 400);
  replace(prisma.package, 'findUnique', async () => pkg);
  assert.equal((await POST(request({ ...input, addOnIds: ['missing'] }))).status, 400);
});
test('database failure hides internal details and never reports slots available', async t => {
  const replace = setup(t);
  replace(prisma.package, 'findUnique', async () => { throw new Error('postgres://private-password'); });
  replace(prisma.booking, 'findMany', async () => []);
  const booking = await POST(request(input));
  assert.equal(booking.status, 503);
  assert.equal((await booking.text()).includes('private-password'), false);
  const slots = await availableSlots(new Request('http://localhost/api/bookings/available-slots?date=2099-01-02&packageId=real'));
  assert.equal(slots.status, 503);
  assert.equal('slots' in await slots.json(), false);
});
test('booking saves server prices and package snapshots', async t => {
  const replace = setup(t);
  replace(prisma, '$transaction', async (run: (tx: unknown) => Promise<unknown>) => run({
    $executeRaw: async () => {},
    booking: { findFirst: async () => null, create: async ({ data }: { data: Record<string, unknown> }) => {
      assert.equal(data.packageNameAtBooking, pkg.name); assert.equal(data.packagePriceAtBooking, pkg.price);
      assert.equal(data.packageDurationAtBooking, 90); assert.equal(data.totalPrice, 100000);
      assert.match(String(data.bookingCode), /^SB-20990102-[A-F0-9]{16}$/);
      return { ...data, addOns: [] };
    } },
  }));
  assert.equal((await POST(request({ ...input, totalPrice: 1 }))).status, 200);
});
