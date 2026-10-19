import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createSessionToken } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { PATCH } from '../src/app/api/bookings/[id]/status/route';
import { DELETE } from '../src/app/api/bookings/[id]/route';

function request(handler: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>, method: string, body?: unknown, authenticated = true) {
  process.env.SESSION_SECRET = 'test-only-status-secret-longer-than-32-bytes';
  const token = createSessionToken({ id: 'admin1', username: 'admin' });
  const req = new NextRequest('http://localhost/api/bookings/booking1/status', { method, body: body ? JSON.stringify(body) : undefined, headers: authenticated ? { cookie: `snapbook_admin_session=${token}` } : {} });
  const store = createRequestStoreForAPI(req, new URL(req.url), { tags: [], expirationsByCacheKind: new Map() }, undefined, undefined);
  return workAsyncStorage.run({ route: '/api/bookings/[id]/status', isStaticGeneration: false } as Parameters<typeof workAsyncStorage.run>[0], () => workUnitAsyncStorage.run(store, () => handler(req, { params: Promise.resolve({ id: 'booking1' }) })));
}
function setup(t: { after: (fn: () => void) => void }) {
  const originals = { admin: prisma.adminUser.findUnique, transaction: prisma.$transaction, update: prisma.booking.update, delete: prisma.booking.delete, addons: prisma.bookingAddOn.deleteMany };
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0 })) as unknown as typeof originals.admin;
  prisma.$transaction = (async () => { throw new Error('UNMOCKED_TRANSACTION'); }) as unknown as typeof originals.transaction;
  prisma.booking.delete = (async () => { throw new Error('PHYSICAL_DELETE_FORBIDDEN'); }) as unknown as typeof originals.delete;
  prisma.bookingAddOn.deleteMany = (async () => { throw new Error('ADDONS_DELETE_FORBIDDEN'); }) as unknown as typeof originals.addons;
  t.after(() => { prisma.adminUser.findUnique = originals.admin; prisma.$transaction = originals.transaction; prisma.booking.update = originals.update; prisma.booking.delete = originals.delete; prisma.bookingAddOn.deleteMany = originals.addons; });
}
test('restoring an active status locks the date then checks full overlap and returns409', async t => {
  setup(t); const events: string[] = [];
  prisma.$transaction = (async (run: (tx: unknown) => Promise<unknown>) => run({
    $executeRaw: async (_sql: unknown, date: string) => { events.push('lock'); assert.equal(date, '2099-01-02'); },
    booking: {
      findUnique: async () => ({ id: 'booking1', date: '2099-01-02', startTime: '10:00', endTime: '11:30', status: 'CANCELLED', archivedAt: null }),
      findFirst: async ({ where }: { where: Record<string, unknown> }) => { events.push('check'); assert.deepEqual(where.id, { not: 'booking1' }); assert.deepEqual(where.startTime, { lt: '11:30' }); assert.deepEqual(where.endTime, { gt: '10:00' }); assert.equal(where.archivedAt, null); return { id: 'other' }; },
      update: async () => { throw new Error('RESTORED_OVERLAP'); },
    },
  })) as unknown as typeof prisma.$transaction;
  assert.equal((await request(PATCH, 'PATCH', { status: 'CONFIRMED' })).status, 409);
  assert.deepEqual(events, ['lock', 'check']);
});
test('archive keeps booking and add-ons and marks reservation cancelled', async t => {
  setup(t);
  prisma.booking.update = (async ({ where, data }: { where: { id: string }; data: { archivedAt: unknown; status: string } }) => { assert.equal(where.id, 'booking1'); assert.ok(data.archivedAt instanceof Date); assert.equal(data.status, 'CANCELLED'); return { id: 'booking1' }; }) as unknown as typeof prisma.booking.update;
  assert.equal((await request(DELETE, 'DELETE')).status, 200);
});
test('missing reservation archive returns404', async t => {
  setup(t);
  prisma.booking.update = (async () => { throw Object.assign(new Error('missing'), { code: 'P2025' }); }) as unknown as typeof prisma.booking.update;
  assert.equal((await request(DELETE, 'DELETE')).status, 404);
});
test('mutations reject unauthenticated requests and invalid statuses', async t => {
  setup(t);
  assert.equal((await request(PATCH, 'PATCH', { status: 'CONFIRMED' }, false)).status, 401);
  assert.equal((await request(DELETE, 'DELETE', undefined, false)).status, 401);
  assert.equal((await request(PATCH, 'PATCH', { status: 'INVALID' })).status, 400);
});
