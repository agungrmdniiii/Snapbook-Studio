import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, hashPassword } from '@/lib/auth';

import { DEFAULT_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.studioConfig.findUnique({
      where: { id: 'default' },
    });
    return NextResponse.json(config || DEFAULT_CONFIG);
  } catch (error) {
    console.error('Error fetching settings, returning fallback:', error);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const data = await request.json();

    const updated = await prisma.studioConfig.upsert({
      where: { id: 'default' },
      update: {
        studioName: data.studioName,
        whatsappNumber: data.whatsappNumber,
        instagramHandle: data.instagramHandle,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        slotDuration: Number(data.slotDuration) || 60,
        address: data.address,
        aboutText: data.aboutText,
      },
      create: {
        id: 'default',
        studioName: data.studioName || 'Snapbook Studio',
        whatsappNumber: data.whatsappNumber || '6281234567890',
        instagramHandle: data.instagramHandle || '@snapbookstudio',
        openingTime: data.openingTime || '09:00',
        closingTime: data.closingTime || '20:00',
        slotDuration: Number(data.slotDuration) || 60,
        address: data.address || '',
        aboutText: data.aboutText || '',
      },
    });

    // Optional admin password update
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      const passwordHash = await hashPassword(data.newPassword.trim());
      await prisma.adminUser.update({
        where: { id: session.id },
        data: { passwordHash },
      });
    }

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan' }, { status: 500 });
  }
}
