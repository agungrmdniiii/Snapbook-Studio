import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG } from '@/lib/catalog';
import { isPublicImageUrl } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (data.type === 'addon') {
      const addon = await prisma.addOn.update({
        where: { id },
        data: {
          name: data.name,
          price: Number(data.price),
          description: data.description,
          isActive: data.isActive,
        },
      });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true, addon });
    }

    if (data.imageUrl && !isPublicImageUrl(data.imageUrl, false)) return NextResponse.json({ error: 'URL foto harus berupa URL HTTPS yang valid' }, { status: 400 });

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        duration: Number(data.duration),
        category: data.category,
        imageUrl: data.imageUrl,
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
        isActive: data.isActive,
        sortOrder: Number(data.sortOrder),
      },
    });

    revalidateTag(CATALOG_CACHE_TAG);

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json({ error: 'Gagal mengupdate paket' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isAddon = searchParams.get('type') === 'addon';

    if (isAddon) {
      const relatedCount = await prisma.bookingAddOn.count({ where: { addOnId: id } });
      if (relatedCount > 0) {
        await prisma.addOn.update({
          where: { id },
          data: { isActive: false },
        });
        revalidateTag(CATALOG_CACHE_TAG);
        return NextResponse.json({ success: true,
          message: 'Add-on berhasil diarsipkan karena memiliki riwayat pemesanan.',
        });
      }
      await prisma.addOn.delete({ where: { id } });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true, message: 'Add-on berhasil dihapus' });
    }

    const bookingCount = await prisma.booking.count({ where: { packageId: id } });
    if (bookingCount > 0) {
      await prisma.package.update({
        where: { id },
        data: { isActive: false },
      });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true,
        message: 'Paket berhasil diarsipkan karena memiliki riwayat pemesanan pelanggan.',
      });
    }

    await prisma.package.delete({ where: { id } });
    revalidateTag(CATALOG_CACHE_TAG);
    return NextResponse.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({ error: 'Gagal menghapus paket' }, { status: 500 });
  }
}
