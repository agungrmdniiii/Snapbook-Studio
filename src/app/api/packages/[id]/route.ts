import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG } from '@/lib/catalog';
import { catalogInput } from '@/lib/catalog-input';
import { readMutationBody, mutationFailure } from '@/lib/api-mutation';
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
    const { type, data } = catalogInput(await readMutationBody(request), false);

    if (type === 'addon') {
      const addon = await prisma.addOn.update({
        where: { id },
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          isActive: data.isActive,
        },
      });
      revalidateTag(CATALOG_CACHE_TAG);
      return NextResponse.json({ success: true, addon });
    }

    // Omitted fields remain undefined instead of becoming NaN or overwriting stored values.
    const pkg = await prisma.package.update({ where: { id }, data });

    revalidateTag(CATALOG_CACHE_TAG);

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return mutationFailure(error, 'Paket atau add-on');
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
    return mutationFailure(error, 'Paket atau add-on');
  }
}
