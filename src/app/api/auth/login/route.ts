import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'admin-login', 10, 15 * 60);
  if (limited) return limited;
  try {
    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password || username.length > 100 || password.length > 1024) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    let admin;
    try {
      admin = await prisma.adminUser.findUnique({
        where: { username },
      });
    } catch {
      return NextResponse.json({ error: 'Layanan sementara tidak tersedia' }, { status: 503 });
    }

    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    const token = createSessionToken({ id: admin.id, username: admin.username, sessionVersion: admin.sessionVersion });

    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
