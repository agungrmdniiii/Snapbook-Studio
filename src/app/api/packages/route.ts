import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG, getStudioCatalog } from '@/lib/catalog';
import { isPublicImageUrl } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';
import { catalogInput } from '@/lib/catalog-input';
import { readMutationBody, mutationFailure } from '@/lib/api-mutation';
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

    const { type, data } = catalogInput(await readMutationBody(request), true);

    if (type === 'addon') {
      const addon = await prisma.addOn.create({
        data: {
          name: data.name!,
          price: data.price!,
          description: data.description || '',
          isActive: data.isActive ?? true,
        },
      });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true, addon });
    }

    // Default: Package
    const pkg = await prisma.package.create({
      data: {
        name: data.name!,
        description: data.description || '',
        price: data.price!,
        duration: data.duration ?? 60,
        category: data.category || 'General',
        imageUrl: data.imageUrl || null,
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    revalidateTag(CATALOG_CACHE_TAG);
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return mutationFailure(error, 'Paket atau add-on');
  }
}
