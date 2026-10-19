import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateGalleryInput, validateImageUpload } from '../src/lib/media-storage';

test('gallery accepts bounded HTTPS metadata and rejects inline, insecure or malformed URLs', () => {
  assert.equal(validateGalleryInput({ url: 'https://example.com/photo.jpg', title: 'Portrait' }).url, 'https://example.com/photo.jpg');
  for (const url of ['data:image/png;base64,AAAA', 'javascript:alert(1)', 'http://example.com/a.jpg', '/gallery/a.jpg', 'https://u:p@example.com/a.jpg', 'x'.repeat(2049)]) {
    assert.throws(() => validateGalleryInput({ url }));
  }
  assert.throws(() => validateGalleryInput({ url: 'https://example.com/a', title: 'x'.repeat(201) }));
  assert.throws(() => validateGalleryInput({ url: 'https://example.com/a', aspectRatio: 'wide' }));
  assert.throws(() => validateGalleryInput({ url: 'https://example.com/a', aspectRatio: ['portrait'] }));
});

test('upload checks magic bytes, declared MIME and four MB Vercel-compatible limit', () => {
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.deepEqual(validateImageUpload(jpg, 'image/jpeg'), { extension: 'jpg', contentType: 'image/jpeg' });
  assert.equal(validateImageUpload(Buffer.from([137,80,78,71,13,10,26,10]), 'image/png').extension, 'png');
  assert.equal(validateImageUpload(Buffer.from('RIFF0000WEBP'), 'image/webp').extension, 'webp');
  assert.throws(() => validateImageUpload(jpg, 'image/png'));
  assert.throws(() => validateImageUpload(Buffer.from('<svg/>'), 'image/svg+xml'));
    const tooLargeForVercel = Buffer.alloc(4 * 1024 * 1024 + 1);
    tooLargeForVercel.set([0xff, 0xd8, 0xff]);
    assert.throws(() => validateImageUpload(tooLargeForVercel, 'image/jpeg'));
});

test('storage upload fails clearly without configuration and sends only file bytes to configured storage', async () => {
  const { uploadGalleryImage } = await import('../src/lib/media-storage');
  const originalStore = process.env.BLOB_STORE_ID;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await assert.rejects(uploadGalleryImage(Buffer.from([0xff,0xd8,0xff,0xe0]), 'image/jpeg'), /belum dikonfigurasi/);
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    globalThis.fetch = async (url, options) => {
      assert.match(String(url), /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/studio-gallery\/[a-f0-9-]+\.jpg$/);
      assert.equal(options?.method, 'POST');
      assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-key');
      assert.equal(new Headers(options?.headers).get('Content-Type'), 'image/jpeg');
      assert.equal(new Headers(options?.headers).get('x-upsert'), 'false');
      assert.deepEqual(Buffer.from(options?.body as Uint8Array), Buffer.from([0xff,0xd8,0xff,0xe0]));
      return new Response('{}', { status: 200 });
    };
    const url = await uploadGalleryImage(Buffer.from([0xff,0xd8,0xff,0xe0]), 'image/jpeg');
    assert.match(url, /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/studio-gallery\/[a-f0-9-]+\.jpg$/);
    globalThis.fetch = async () => new Response('private backend error', { status: 500 });
    await assert.rejects(uploadGalleryImage(Buffer.from([0xff,0xd8,0xff,0xe0]), 'image/jpeg'), /Gagal mengunggah/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStore === undefined) delete process.env.BLOB_STORE_ID; else process.env.BLOB_STORE_ID = originalStore;
    if (originalBlobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});

test('configured Blob upload uses public immutable UUID paths and validated MIME without exposing credentials', async () => {
  const { uploadGalleryImage } = await import('../src/lib/media-storage');
  const keys = ['BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('must not use Supabase when Blob is configured'); };
  try {
    process.env.SUPABASE_URL = 'https://must-not-be-used.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-supabase-key';
    for (const configuredBy of ['BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN'] as const) {
      delete process.env.BLOB_STORE_ID;
      delete process.env.BLOB_READ_WRITE_TOKEN;
      process.env[configuredBy] = configuredBy === 'BLOB_STORE_ID' ? 'store_test-only' : 'test-only-blob-token';
      const url = await uploadGalleryImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg', async (pathname, bytes, options) => {
        assert.match(pathname, /^gallery\/[a-f0-9-]+\.jpg$/);
        assert.deepEqual(Buffer.from(bytes), Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
        assert.equal(options.access, 'public');
        assert.equal(options.contentType, 'image/jpeg');
        assert.equal(options.addRandomSuffix, false);
        assert.equal(options.cacheControlMaxAge, 31536000);
        assert.equal(options.allowOverwrite, false);
        assert.equal(options.token, undefined);
        assert.equal(options.oidcToken, undefined);
        return { url: `https://test-only.public.blob.vercel-storage.com/${pathname}` };
      });
      assert.match(url, /^https:\/\/test-only\.public\.blob\.vercel-storage\.com\/gallery\/[a-f0-9-]+\.jpg$/);
    }
    await assert.rejects(uploadGalleryImage(Buffer.from([0xff, 0xd8, 0xff]), 'image/png', async () => { throw new Error('must not upload invalid MIME'); }), /Foto harus/);
    await assert.rejects(uploadGalleryImage(Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg', async () => { throw new Error('test-only-private-provider-detail'); }), /Gagal mengunggah foto/);
    await assert.rejects(uploadGalleryImage(Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg', async () => ({ url: 'data:image/jpeg;base64,AAAA' })), /Gagal mengunggah foto/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
