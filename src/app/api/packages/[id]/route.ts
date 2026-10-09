import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

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
      return NextResponse.json({ success: true, addon });
    }

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
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isAddon = searchParams.get('type') === 'addon';

    if (isAddon) {
      await prisma.addOn.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Add-on berhasil dihapus' });
    }

    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({ error: 'Gagal menghapus paket' }, { status: 500 });
  }
}
