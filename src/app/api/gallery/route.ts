import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { CATALOG_CACHE_TAG, getStudioCatalog } from '@/lib/catalog';
import { validateGalleryInput } from '@/lib/media-storage';

export async function GET() {
  try {
    const { gallery } = await getStudioCatalog();
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Galeri sementara tidak tersedia' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await getAdminSession()) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    if (Number(request.headers.get('content-length')) > 16384) return NextResponse.json({ error: 'Data foto terlalu besar' }, { status: 413 });
    const text = await request.text();
    if (text.length > 16384) return NextResponse.json({ error: 'Data foto terlalu besar' }, { status: 413 });
    let data;
    try { data = validateGalleryInput(JSON.parse(text)); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Data foto tidak valid' }, { status: 400 }); }
    const image = await prisma.showcaseImage.create({ data });
    revalidateTag(CATALOG_CACHE_TAG);
    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json({ error: 'Gagal menambahkan foto galeri' }, { status: 500 });
  }
}
