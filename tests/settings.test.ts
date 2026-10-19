import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { NextRequest } from 'next/server';
import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createSessionToken, verifyPassword } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { GET, PUT } from '../src/app/api/settings/route';

const configInput = { studioName: 'New studio', openingTime: '09:00', closingTime: '20:00', slotDuration: 60 };
function save(data: unknown) {
  process.env.SESSION_SECRET = 'settings-test-only-secret-at-least-32-bytes';
  const token = createSessionToken({ id: 'admin1', username: 'admin' });
  const request = new NextRequest('http://localhost/api/settings', { method: 'PUT', headers: { cookie: `snapbook_admin_session=${token}`, 'content-type': 'application/json' }, body: JSON.stringify(data) });
  const store = createRequestStoreForAPI(request, new URL(request.url), { tags: [], expirationsByCacheKind: new Map() }, undefined, undefined);
  return workAsyncStorage.run({ route: '/api/settings', isStaticGeneration: false, incrementalCache: {} } as Parameters<typeof workAsyncStorage.run>[0], () => workUnitAsyncStorage.run(store, () => PUT(request)));
}
function database(t: TestContext, failPassword = false) {
  const originals = { admin: prisma.adminUser.findUnique, config: prisma.studioConfig.upsert, update: prisma.adminUser.update, transaction: prisma.$transaction };
  let stored = { studioName: 'Original studio', passwordHash: '', sessionVersion: 0 };
  type State = typeof stored;
  const methods = (state: State) => ({
    auditEvent:{create:async()=>({})},
    studioConfig: { upsert: async (args: { update: { studioName: string } }) => { state.studioName = args.update.studioName; return { id: 'default', studioName: state.studioName }; } },
    adminUser: { update: async (args: { data: { passwordHash: string; sessionVersion: { increment: number } } }) => {
      if (failPassword) throw new Error('test password write failed');
      state.passwordHash = args.data.passwordHash;
      state.sessionVersion += args.data.sessionVersion.increment;
      return { id: 'admin1' };
    } },
  });
  prisma.adminUser.findUnique = (async () => ({ id: 'admin1', username: 'admin', sessionVersion: 0 })) as unknown as typeof originals.admin;
  prisma.studioConfig.upsert = methods(stored).studioConfig.upsert as unknown as typeof originals.config;
  prisma.adminUser.update = methods(stored).adminUser.update as unknown as typeof originals.update;
  prisma.$transaction = (async (run: (tx: ReturnType<typeof methods>) => Promise<unknown>) => {
    const draft = { ...stored };
    const result = await run(methods(draft));
    stored = draft;
    return result;
  }) as unknown as typeof originals.transaction;
  t.after(() => { prisma.adminUser.findUnique = originals.admin; prisma.studioConfig.upsert = originals.config; prisma.adminUser.update = originals.update; prisma.$transaction = originals.transaction; });
  return () => stored;
}

test('settings rejects a padded short password before changing configuration', async (t) => {
  const stored = database(t);
  const response = await save({ ...configInput, newPassword: '      abcdef' });
  assert.equal(response.status, 400);
  assert.equal(stored().studioName, 'Original studio');
});

test('settings rolls back configuration if the password write fails', async (t) => {
  const stored = database(t, true);
  const response = await save({ ...configInput, newPassword: 'a-new-strong-test-password' });
  assert.equal(response.status, 500);
  assert.equal(stored().studioName, 'Original studio');
  assert.equal(stored().sessionVersion, 0);
});

test('password updates revoke sessions and tell the client to sign in again', async (t) => {
  const stored = database(t);
  const response = await save({ ...configInput, newPassword: '  a-new-strong-test-password  ' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).requiresLogin, true);
  assert.equal(stored().studioName, 'New studio');
  assert.equal(stored().sessionVersion, 1);
  assert.equal(await verifyPassword('a-new-strong-test-password', stored().passwordHash), true);
});

test('settings source failures return unavailable instead of fabricated defaults', async (t) => {
  const original = prisma.studioConfig.findUnique;
  prisma.studioConfig.findUnique = (async () => { throw new Error('test unavailable'); }) as typeof original;
  t.after(() => { prisma.studioConfig.findUnique = original; });
  const response = await GET();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).studioName, undefined);
});
