import type { put } from '@vercel/blob';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function isPublicImageUrl(value: unknown, allowLocal = true): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (allowLocal && /^\/gallery\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function validateGalleryInput(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Data foto tidak valid');
  const input = data as Record<string, unknown>;
  if (!isPublicImageUrl(input.url, false)) throw new Error('URL foto harus berupa URL HTTPS yang valid (maksimal 2048 karakter)');
  const title = input.title ?? '';
  const category = input.category ?? 'General';
  const aspectRatio = input.aspectRatio ?? 'portrait';
  const sortOrder = input.sortOrder ?? 0;
  if (typeof title !== 'string' || title.length > 200 || typeof category !== 'string' || !category.trim() || category.length > 80) throw new Error('Judul atau kategori foto tidak valid');
  if (typeof aspectRatio !== 'string' || !['portrait', 'square', 'landscape'].includes(aspectRatio)) throw new Error('Orientasi foto tidak valid');
  if (typeof sortOrder !== 'number' || !Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) throw new Error('Urutan foto tidak valid');
  return { url: input.url, title: title.trim(), category: category.trim(), aspectRatio: aspectRatio as string, sortOrder };
}

export function validateImageUpload(bytes: Uint8Array, declaredType: string) {
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error('Ukuran foto harus antara 1 byte dan 4 MB');
  let contentType = '';
  let extension = '';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) { contentType = 'image/jpeg'; extension = 'jpg'; }
  else if (Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { contentType = 'image/png'; extension = 'png'; }
  else if (Buffer.from(bytes.subarray(0, 4)).toString() === 'RIFF' && Buffer.from(bytes.subarray(8, 12)).toString() === 'WEBP') { contentType = 'image/webp'; extension = 'webp'; }
  if (!contentType || declaredType !== contentType) throw new Error('Foto harus berupa JPEG, PNG, atau WebP yang valid');
  return { extension, contentType };
}

export class StorageUnavailableError extends Error {}

export type BlobUploader = (
  pathname: string,
  body: Buffer,
  options: Parameters<typeof put>[2],
) => Promise<{ url: string }>;

export async function uploadGalleryImage(bytes: Uint8Array, declaredType: string, blobUploader?: BlobUploader) {
  const { extension, contentType } = validateImageUpload(bytes, declaredType);
  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const upload = blobUploader ?? (await import('@vercel/blob')).put;
      const blob = await upload(`gallery/${crypto.randomUUID()}.${extension}`, Buffer.from(bytes), {
        access: 'public', contentType, addRandomSuffix: false, allowOverwrite: false,
        cacheControlMaxAge: 31536000,
      });
      if (!isPublicImageUrl(blob.url, false)) throw new Error('Invalid storage URL');
      return blob.url;
    } catch {
      throw new StorageUnavailableError('Gagal mengunggah foto ke penyimpanan. Silakan coba kembali atau gunakan URL HTTPS.');
    }
  }
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key || !isPublicImageUrl(baseUrl, false)) throw new StorageUnavailableError('Upload foto belum dikonfigurasi. Gunakan URL HTTPS untuk menambahkan foto.');
  const filename = `${crypto.randomUUID()}.${extension}`;
  const base = new URL(baseUrl).origin;
  let response: Response;
  try { response = await fetch(`${base}/storage/v1/object/studio-gallery/${filename}`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': contentType, 'x-upsert': 'false' },
    body: Buffer.from(bytes), signal: AbortSignal.timeout(30000),
  });
  } catch { throw new StorageUnavailableError('Penyimpanan foto tidak merespons. Silakan coba kembali atau gunakan URL HTTPS.'); }
  if (!response.ok) throw new StorageUnavailableError('Gagal mengunggah foto ke penyimpanan. Silakan coba kembali atau gunakan URL HTTPS.');
  return `${base}/storage/v1/object/public/studio-gallery/${filename}`;
}
