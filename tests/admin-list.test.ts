import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createSessionToken } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { GET } from '../src/app/api/bookings/list/route';

function requestList(query: string, authenticated = true) {
  process.env.SESSION_SECRET = 'test-only-admin-list-secret-with-32-bytes';
  const token = createSessionToken({ id: 'admin1', username: 'admin' });
  const request = new NextRequest(`http://localhost/api/bookings/list?${query}`, {
    headers: authenticated ? { cookie: `snapbook_admin_session=${token}` } : {},
  });
  const store = createRequestStoreForAPI(request, new URL(request.url), { tags: [], expirationsByCacheKind: new Map() }, undefined, undefined);
  return workAsyncStorage.run({ route: '/api/bookings/list', isStaticGeneration: false } as Parameters<typeof workAsyncStorage.run>[0], () => workUnitAsyncStorage.run(store, () => GET(request)));
}

test('booking list caps page size and computes metrics across the filtered result', async (t) => {
  const originals = { findMany: prisma.booking.findMany, count: prisma.booking.count, aggregate: prisma.booking.aggregate, admin: prisma.adminUser.findUnique };
  const queries: unknown[] = [];
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0 })) as unknown as typeof originals.admin;
  prisma.booking.findMany = (async (query: unknown) => { queries.push(query); return [{ id: 'page-booking', totalPrice: 10, package: {name: 'Changed catalog',price: 20,duration:120}, packageNameAtBooking: 'Booked package', packagePriceAtBooking: 10, packageDurationAtBooking: 60 }]; }) as unknown as typeof originals.findMany;
  prisma.booking.count = (async (query: { where: { AND?: [{}, { status?: string }] } }) => query.where.AND?.[1].status === 'PENDING' ? 7 : query.where.AND?.[1].status === 'CONFIRMED' ? 12 : query.where.AND?.[1].status === 'COMPLETED' ? 21 : 80) as unknown as typeof originals.count;
  prisma.booking.aggregate = (async () => ({ _sum: { totalPrice: 1234000 } })) as unknown as typeof originals.aggregate;
  t.after(() => { prisma.booking.findMany = originals.findMany; prisma.booking.count = originals.count; prisma.booking.aggregate = originals.aggregate; prisma.adminUser.findUnique = originals.admin; });
  const response = await requestList('page=2&pageSize=999&date=2026-10-20&search=alice');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.page, 2);
  assert.equal(data.pageSize, 50);
  assert.equal(data.total, 80);
  assert.deepEqual(data.bookings[0].package,{name: 'Booked package',price:10,duration:60});
  assert.deepEqual(data.stats, { total: 80, pending: 7, confirmed: 12, completed: 21, revenue: 1234000 });
  const query = queries[0] as { take: number; skip: number; where: { archivedAt: null; date: string; OR: unknown[] } };
  assert.equal(query.take, 50);
  assert.equal(query.skip, 50);
  assert.equal(query.where.archivedAt, null);
  assert.equal(query.where.date, '2026-10-20');
  assert.equal(query.where.OR.length, 4);
});

test('booking list rejects invalid pagination, status and dates before querying', async (t) => {
  const originalAdmin = prisma.adminUser.findUnique;
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0 })) as unknown as typeof originalAdmin;
  t.after(() => { prisma.adminUser.findUnique = originalAdmin; });
  for (const query of ['page=0', 'page=1.5', 'pageSize=-1', 'status=INVALID', 'date=2026-02-30']) {
    assert.equal((await requestList(query)).status, 400);
  }
});

test('booking list requires authentication', async () => {
  assert.equal((await requestList('', false)).status, 401);
});

