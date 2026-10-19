import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin-session';

import { invalidateStudioConfigCache } from '@/lib/constants';
import { revalidateTag } from 'next/cache';
import { readMutationBody, MutationInputError, mutationFailure } from '@/lib/api-mutation';
import { audit } from '@/lib/studio-operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.studioConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) return NextResponse.json({ error: 'Pengaturan studio belum tersedia' }, { status: 503 });
    return NextResponse.json(config, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Pengaturan studio sementara tidak tersedia' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 401 });
    }

    const data: any = await readMutationBody(request);
    const password = typeof data?.newPassword === 'string' ? data.newPassword.trim() : '';
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        typeof data.openingTime !== 'string' || typeof data.closingTime !== 'string' ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.openingTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.closingTime) || data.openingTime >= data.closingTime ||
        !['number','string'].includes(typeof data.slotDuration) || !Number.isInteger(Number(data.slotDuration)) || Number(data.slotDuration) < 5 || Number(data.slotDuration) > 720 ||
        (data.bufferMinutes!==undefined&&(!Number.isInteger(data.bufferMinutes)||data.bufferMinutes<0||data.bufferMinutes>180)) ||
        (data.newPassword !== undefined && data.newPassword !== '' && (typeof data.newPassword !== 'string' || password.length < 12 || password.length > 128))) {
      return NextResponse.json({ error: 'Jam operasional/interval tidak valid. Password baru minimal 12 karakter.' }, { status: 400 });
    }

    const textLimits = { studioName: 200, whatsappNumber: 30, instagramHandle: 100, address: 1000, aboutText: 4000 };
    for (const [key, max] of Object.entries(textLimits)) {
      if (data[key] !== undefined && (typeof data[key] !== 'string' || data[key].trim().length > max)) throw new MutationInputError('Profil studio berisi teks yang tidak valid.');
    }
    if (data.studioName !== undefined && !data.studioName.trim()) throw new MutationInputError('Nama studio wajib diisi.');
    if (data.whatsappNumber !== undefined && !/^\+?[0-9][0-9 ()-]{6,28}[0-9]$/.test(data.whatsappNumber)) throw new MutationInputError('Nomor WhatsApp studio tidak valid.');

    const passwordHash = password ? await hashPassword(password) : null;
    const updated = await prisma.$transaction(async (tx) => {
      const config = await tx.studioConfig.upsert({
      where: { id: 'default' },
      update: {
        studioName: data.studioName,
        whatsappNumber: data.whatsappNumber,
        instagramHandle: data.instagramHandle,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        slotDuration: Number(data.slotDuration) || 60,
        ...(data.bufferMinutes===undefined?{}:{bufferMinutes:data.bufferMinutes}),
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
        bufferMinutes:data.bufferMinutes??0,
        address: data.address || '',
        aboutText: data.aboutText || '',
      },
      });
      if (passwordHash) {
        await tx.adminUser.update({
          where: { id: session.id },
          data: { passwordHash, sessionVersion: { increment: 1 } },
        });
      }
      await audit(tx,session,'SETTINGS_UPDATED',null,undefined,{openingTime:config.openingTime,closingTime:config.closingTime,slotDuration:config.slotDuration,bufferMinutes:config.bufferMinutes});
      return config;
    });

    invalidateStudioConfigCache();
    revalidateTag('studio-catalog');

    return NextResponse.json({ success: true, config: updated, requiresLogin: Boolean(passwordHash) });
  } catch (error) {
    return mutationFailure(error, 'Pengaturan studio');
  }
}
