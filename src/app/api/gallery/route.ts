import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

import { DEFAULT_GALLERY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const images = await prisma.showcaseImage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(images.length > 0 ? images : DEFAULT_GALLERY);
  } catch (error) {
    console.error('Error fetching gallery, returning fallback:', error);
    return NextResponse.json(DEFAULT_GALLERY);
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

    if (!data.url) {
      return NextResponse.json({ error: 'URL foto wajib diisi' }, { status: 400 });
    }

    const image = await prisma.showcaseImage.create({
      data: {
        url: data.url,
        title: data.title || '',
        category: data.category || 'General',
        aspectRatio: data.aspectRatio || 'portrait',
        sortOrder: Number(data.sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json({ error: 'Gagal menambahkan foto galeri' }, { status: 500 });
  }
}
