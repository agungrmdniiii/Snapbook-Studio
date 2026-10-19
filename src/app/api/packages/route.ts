import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG, getStudioCatalog } from '@/lib/catalog';
import { isPublicImageUrl } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';

export async function GET(request: Request) {
  try {
    const includeInactive = new URL(request.url).searchParams.get('all') === 'true';
    if (includeInactive) {
      if (!await getAdminSession()) return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
      const [packages, addOns] = await Promise.all([
        prisma.package.findMany({ orderBy: { sortOrder: 'asc' } }), prisma.addOn.findMany(),
      ]);
      return NextResponse.json({ packages: packages.map(pkg => ({ ...pkg, imageUrl: pkg.imageUrl && isPublicImageUrl(pkg.imageUrl) ? pkg.imageUrl : null })), addOns }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const { packages, addOns } = await getStudioCatalog();
    return NextResponse.json({ packages, addOns });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Katalog sementara tidak tersedia' }, { status: 503 });
  }
}
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const data = await request.json();

    if (data.type === 'addon') {
      const addon = await prisma.addOn.create({
        data: {
          name: data.name,
          price: Number(data.price),
          description: data.description || '',
          isActive: data.isActive ?? true,
        },
      });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true, addon });
    }

    if (data.imageUrl && !isPublicImageUrl(data.imageUrl, false)) return NextResponse.json({ error: 'URL foto harus berupa URL HTTPS yang valid' }, { status: 400 });

    // Default: Package
    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        duration: Number(data.duration) || 60,
        category: data.category || 'General',
        imageUrl: data.imageUrl || null,
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
        isActive: data.isActive ?? true,
        sortOrder: Number(data.sortOrder) || 0,
      },
    });

    revalidateTag(CATALOG_CACHE_TAG);
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ error: 'Gagal membuat paket' }, { status: 500 });
  }
}
