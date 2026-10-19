import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { MAX_IMAGE_BYTES, StorageUnavailableError, uploadGalleryImage } from '@/lib/media-storage';

export async function POST(request: Request) {
  try {
    if (!await getAdminSession()) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    const limit = MAX_IMAGE_BYTES + 65536;
    if (Number(request.headers.get('content-length')) > limit) return NextResponse.json({ error: 'Ukuran foto maksimal 4 MB' }, { status: 413 });
    // Bound multipart buffering even when the request omits Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'File foto wajib diisi' }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        return NextResponse.json({ error: 'Ukuran foto maksimal 4 MB' }, { status: 413 });
      }
      chunks.push(value);
    }
    let form;
    try { form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': request.headers.get('content-type') || '' }, body: Buffer.concat(chunks) }).formData(); }
    catch { return NextResponse.json({ error: 'Form upload tidak valid' }, { status: 400 }); }
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'File foto wajib diisi' }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Ukuran foto maksimal 4 MB' }, { status: 413 });
    try {
      const url = await uploadGalleryImage(new Uint8Array(await file.arrayBuffer()), file.type);
      return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      if (error instanceof StorageUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
      if (error instanceof Error && error.name === 'TimeoutError') return NextResponse.json({ error: 'Penyimpanan foto tidak merespons. Silakan coba kembali.' }, { status: 503 });
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Foto tidak valid' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gallery upload failed:', error);
    return NextResponse.json({ error: 'Gagal mengunggah foto' }, { status: 503 });
  }
}
