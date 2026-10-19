import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readStudioCatalog } from '../src/lib/catalog';

test('catalog preserves empty lists and excludes inline image payloads', async () => {
  const db = {
    studioConfig: { findUnique: async () => ({ id: 'default', studioName: 'Live Studio' }) },
    package: { findMany: async () => [] }, addOn: { findMany: async () => [] },
    showcaseImage: { findMany: async () => [
      { id: 'inline', url: 'data:image/jpeg;base64,AAAA' },
      { id: 'photo', url: '/gallery/migrated.jpg' },
    ] },
  };
  const catalog = await readStudioCatalog(db as any);
  assert.deepEqual(catalog.packages, []);
  assert.deepEqual(catalog.addOns, []);
  assert.deepEqual(catalog.gallery.map(image => image.id), ['photo']);
});

test('catalog surfaces source failure instead of inventing bookable data', async () => {
  const db = {
    studioConfig: { findUnique: async () => { throw new Error('offline'); } },
    package: { findMany: async () => [] }, addOn: { findMany: async () => [] },
    showcaseImage: { findMany: async () => [] },
  };
  await assert.rejects(readStudioCatalog(db as any), /offline/);
});

test('catalog starts independent reads together rather than waiting for each query', async () => {
  let started = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const read = async <T,>(value: T) => { started += 1; if (started === 4) release(); await gate; return value; };
  const db = {
    studioConfig: { findUnique: () => read(null) }, package: { findMany: () => read([]) },
    addOn: { findMany: () => read([]) }, showcaseImage: { findMany: () => read([]) },
  };
  const timeout = setTimeout(() => release(), 100);
  try {
    const pending = readStudioCatalog(db as any);
    assert.equal(started, 4);
    assert.deepEqual((await pending).packages, []);
  } finally { clearTimeout(timeout); }
});


import { NextRequest } from 'next/server';
import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createSessionToken } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { GET as getPackages } from '../src/app/api/packages/route';
import { POST as addGallery } from '../src/app/api/gallery/route';

function inRequest(request: NextRequest, run: () => Promise<Response>) {
  const store = createRequestStoreForAPI(request, new URL(request.url), { tags: [], expirationsByCacheKind: new Map() }, undefined, undefined);
  return workAsyncStorage.run({ route: '/api/packages', isStaticGeneration: false } as Parameters<typeof workAsyncStorage.run>[0], () => workUnitAsyncStorage.run(store, run));
}

test('inactive package listing requires admin and preserves deliberate empty lists', async (t) => {
  process.env.SESSION_SECRET = 'test-only-catalog-secret-at-least-32-bytes';
  const original = { admin: prisma.adminUser.findUnique, packages: prisma.package.findMany, addons: prisma.addOn.findMany };
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0, passwordHash: 'test-only-hash', createdAt: new Date() })) as typeof original.admin;
  prisma.package.findMany = (async () => []) as typeof original.packages;
  prisma.addOn.findMany = (async () => []) as typeof original.addons;
  t.after(() => { prisma.adminUser.findUnique = original.admin; prisma.package.findMany = original.packages; prisma.addOn.findMany = original.addons; });
  let request = new NextRequest('http://localhost/api/packages?all=true');
  assert.equal((await inRequest(request, () => getPackages(request))).status, 401);
  const token = createSessionToken({ id: 'admin1', username: 'admin' });
  request = new NextRequest('http://localhost/api/packages?all=true', { headers: { cookie: `snapbook_admin_session=${token}` } });
  const response = await inRequest(request, () => getPackages(request));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(await response.json(), { packages: [], addOns: [] });
});

test('gallery mutation refuses inline payload before writing database', async (t) => {
  process.env.SESSION_SECRET = 'test-only-catalog-secret-at-least-32-bytes';
  const originalAdmin = prisma.adminUser.findUnique;
  const originalCreate = prisma.showcaseImage.create;
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0, passwordHash: 'test-only-hash', createdAt: new Date() })) as typeof originalAdmin;
  prisma.showcaseImage.create = (async () => { throw new Error('must not write invalid photo'); }) as typeof originalCreate;
  t.after(() => { prisma.adminUser.findUnique = originalAdmin; prisma.showcaseImage.create = originalCreate; });
  const token = createSessionToken({ id: 'admin1', username: 'admin' });
  const request = new NextRequest('http://localhost/api/gallery', {
    method: 'POST', headers: { cookie: `snapbook_admin_session=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'data:image/png;base64,AAAA' }),
  });
  const response = await inRequest(request, () => addGallery(request));
  assert.equal(response.status, 400);
});
