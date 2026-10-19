import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const token = new NextRequest(request).cookies.get(SESSION_COOKIE_NAME)?.value;
  const admin = token ? verifySessionToken(token) : null;
  let failed = false;
  if (admin) {
    try {
      await prisma.adminUser.updateMany({ where: { id: admin.id, sessionVersion: admin.sessionVersion }, data: { sessionVersion: { increment: 1 } } });
    } catch { failed = true; }
  }
  const response = failed
    ? NextResponse.json({ error: 'Sesi gagal dicabut. Coba lagi.' }, { status: 503 })
    : NextResponse.json({ success: true, message: 'Berhasil logout' });
  if (failed) return response;
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
