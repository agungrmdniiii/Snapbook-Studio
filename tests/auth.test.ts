import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import { createSessionToken, verifySessionToken, hashPassword } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { POST as login } from '../src/app/api/auth/login/route';
import { enforceRateLimit } from '../src/lib/rate-limit';
import { POST as logout } from '../src/app/api/auth/logout/route';

const secret = 'a-test-only-secret-of-at-least-32-bytes';
function signed(payload: unknown) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${crypto.createHmac('sha256', secret).update(encoded).digest('base64url')}`;
}

test('session signing requires a configured strong secret and verification fails closed', () => {
  const previous = process.env.SESSION_SECRET;
  try {
    for (const value of [undefined, '', 'too-short']) {
      if (value === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = value;
      assert.throws(() => createSessionToken({ id: 'user1', username: 'admin' }));
      assert.equal(verifySessionToken(signed({ id: 'user1', username: 'admin' })), null);
    }
  } finally {
    if (previous === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous;
  }
});

test('sessions expire after seven days and carry a revocable version', () => {
  process.env.SESSION_SECRET = secret;
  const before = Date.now();
  const token = createSessionToken({ id: 'user1', username: 'admin', sessionVersion: 3 });
  const payload = verifySessionToken(token)!;
  assert.equal(payload.id, 'user1');
  assert.equal(payload.sessionVersion, 3);
  assert.ok(payload.iat >= before && payload.iat <= Date.now());
  assert.equal(payload.exp - payload.iat, 7 * 24 * 60 * 60 * 1000);
  assert.equal(verifySessionToken(token + '.extra'), null);
  assert.equal(verifySessionToken(token.slice(0, -1) + '!'), null);
});

test('valid signatures cannot authorize expired, future, legacy or malformed claims', () => {
  process.env.SESSION_SECRET = secret;
  const now = Date.now();
  const valid = { v: 1, id: 'user1', username: 'admin', iat: now - 1000, exp: now + 1000, sessionVersion: 0 };
  assert.ok(verifySessionToken(signed(valid)));
  for (const payload of [
    { ...valid, exp: now - 1 }, { ...valid, iat: now + 60000 },
    { ...valid, exp: now + 8 * 24 * 60 * 60 * 1000 },
    { ...valid, sessionVersion: -1 }, { ...valid, sessionVersion: '0' },
    { ...valid, id: '' }, { ...valid, username: [] }, { ...valid, v: 2 },
    { id: 'user1', username: 'admin' }, null, [], 'admin',
  ]) assert.equal(verifySessionToken(signed(payload)), null);
});

test('login rejects fallback credentials without a stored admin', async (t) => {
  process.env.SESSION_SECRET = secret;
  const originalLookup = prisma.adminUser.findUnique;
  prisma.adminUser.findUnique = (async () => null) as typeof originalLookup;
  t.after(() => { prisma.adminUser.findUnique = originalLookup; });
  const originalQuery = prisma.$queryRaw;
  prisma.$queryRaw = (async () => [{ count: 1, resetAt: new Date(Date.now() + 900000) }]) as typeof originalQuery;
  t.after(() => { prisma.$queryRaw = originalQuery; });
  const response = await login(new Request('http://localhost/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpassword123' }),
  }));
  assert.equal(response.status, 401);
});

test('login returns unavailable when the admin database fails', async (t) => {
  const originalLookup = prisma.adminUser.findUnique;
  prisma.adminUser.findUnique = (async () => { throw new Error('test unavailable'); }) as typeof originalLookup;
  t.after(() => { prisma.adminUser.findUnique = originalLookup; });
  const originalQuery = prisma.$queryRaw;
  prisma.$queryRaw = (async () => [{ count: 1, resetAt: new Date(Date.now() + 900000) }]) as typeof originalQuery;
  t.after(() => { prisma.$queryRaw = originalQuery; });
  const response = await login(new Request('http://localhost/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpassword123' }),
  }));
  assert.equal(response.status, 503);
});

test('login signs the stored administrator version after checking the password', async (t) => {
  const originalLookup = prisma.adminUser.findUnique;
  const originalQuery = prisma.$queryRaw;
  const passwordHash = await hashPassword('unique-test-password');
  prisma.adminUser.findUnique = (async () => ({ id: 'stored-user', username: 'stored-admin', passwordHash, sessionVersion: 7, createdAt: new Date() })) as typeof originalLookup;
  prisma.$queryRaw = (async () => [{ count: 1, resetAt: new Date(Date.now() + 900000) }]) as typeof originalQuery;
  t.after(() => { prisma.adminUser.findUnique = originalLookup; prisma.$queryRaw = originalQuery; });
  const response = await login(new Request('http://localhost/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'stored-admin', password: 'unique-test-password' }),
  }));
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')!;
  const token = cookie.split(';')[0].split('=')[1];
  assert.equal(verifySessionToken(token)?.sessionVersion, 7);
  assert.equal(verifySessionToken(token)?.id, 'stored-user');
});

test('shared limiter rejects exhausted buckets and fails closed if storage fails', async (t) => {
  const originalQuery = prisma.$queryRaw;
  t.after(() => { prisma.$queryRaw = originalQuery; });
  prisma.$queryRaw = (async () => [{ count: 11, resetAt: new Date(Date.now() + 10000) }]) as typeof originalQuery;
  const limited = await enforceRateLimit(new Request('http://localhost'), 'login', 10, 900);
  assert.equal(limited?.status, 429);
  assert.ok(Number(limited?.headers.get('retry-after')) >= 1);
  prisma.$queryRaw = (async () => { throw new Error('test unavailable'); }) as typeof originalQuery;
  assert.equal((await enforceRateLimit(new Request('http://localhost'), 'login', 10, 900))?.status, 503);
});

test('limiter uses private stable buckets and ignores untrusted forwarded addresses', async (t) => {
  const originalQuery = prisma.$queryRaw;
  const previousVercel = process.env.VERCEL;
  delete process.env.VERCEL;
  const keys: unknown[] = [];
  prisma.$queryRaw = (async (_query: unknown, key: unknown) => {
    keys.push(key);
    return [{ count: 1, resetAt: new Date(Date.now() + 10000) }];
  }) as typeof originalQuery;
  t.after(() => {
    prisma.$queryRaw = originalQuery;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  });
  for (const ip of ['192.0.2.1', '192.0.2.2']) {
    assert.equal(await enforceRateLimit(new Request('http://localhost', { headers: { 'x-real-ip': ip } }), 'login', 10, 900), null);
  }
  assert.equal(keys[0], keys[1]);
  assert.match(String(keys[0]), /^[a-f0-9]{64}$/);
  process.env.VERCEL = '1';
  await enforceRateLimit(new Request('http://localhost', { headers: { 'x-real-ip': '192.0.2.1' } }), 'login', 10, 900);
  assert.notEqual(keys[0], keys[2]);
});

test('logout revokes the signed version and clears its cookie', async (t) => {
  const originalUpdate = prisma.adminUser.updateMany;
  let storedVersion = 3;
  prisma.adminUser.updateMany = (async (args: { where: { id: string; sessionVersion: number }; data: { sessionVersion: { increment: number } } }) => {
    if (args.where.id === 'user1' && args.where.sessionVersion === storedVersion) {
      storedVersion += args.data.sessionVersion.increment;
      return { count: 1 };
    }
    return { count: 0 };
  }) as unknown as typeof originalUpdate;
  t.after(() => { prisma.adminUser.updateMany = originalUpdate; });
  const token = createSessionToken({ id: 'user1', username: 'admin', sessionVersion: 3 });
  const response = await logout(new Request('http://localhost/api/auth/logout', {
    method: 'POST', headers: { cookie: `snapbook_admin_session=${token}` },
  }));
  assert.equal(response.status, 200);
  assert.equal(storedVersion, 4);
  assert.match(response.headers.get('set-cookie')!, /Max-Age=0/);
  await logout(new Request('http://localhost/api/auth/logout', {
    method: 'POST', headers: { cookie: `snapbook_admin_session=${token}` },
  }));
  assert.equal(storedVersion, 4);
});

test('logout retains the cookie after failed revocation so the user can retry', async (t) => {
  const originalUpdate = prisma.adminUser.updateMany;
  prisma.adminUser.updateMany = (async () => { throw new Error('test unavailable'); }) as unknown as typeof originalUpdate;
  t.after(() => { prisma.adminUser.updateMany = originalUpdate; });
  const token = createSessionToken({ id: 'user1', username: 'admin' });
  const response = await logout(new Request('http://localhost/api/auth/logout', {
    method: 'POST', headers: { cookie: `snapbook_admin_session=${token}` },
  }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
  prisma.adminUser.updateMany = (async () => ({ count: 1 })) as unknown as typeof originalUpdate;
  const retried = await logout(new Request('http://localhost/api/auth/logout', {
    method: 'POST', headers: { cookie: `snapbook_admin_session=${token}` },
  }));
  assert.equal(retried.status, 200);
  assert.match(retried.headers.get('set-cookie')!, /Max-Age=0/);
});


