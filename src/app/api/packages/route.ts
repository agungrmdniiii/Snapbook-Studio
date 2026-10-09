import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    const packages = await prisma.package.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const addOns = await prisma.addOn.findMany({
      where: includeInactive ? {} : { isActive: true },
    });

    return NextResponse.json({ packages, addOns });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Gagal mengambil paket' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

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
      return NextResponse.json({ success: true, addon });
    }

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

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ error: 'Gagal membuat paket' }, { status: 500 });
  }
}
