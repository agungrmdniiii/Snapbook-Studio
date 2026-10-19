import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';

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
    await prisma.showcaseImage.delete({ where: { id } });
    revalidateTag(CATALOG_CACHE_TAG);

    return NextResponse.json({ success: true, message: 'Foto berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Gagal menghapus foto' }, { status: 500 });
  }
}
