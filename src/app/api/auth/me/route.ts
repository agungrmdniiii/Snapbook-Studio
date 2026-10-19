import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';

export async function GET() {
  const payload = await getAdminSession();
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: payload.id, username: payload.username },
  });
}
