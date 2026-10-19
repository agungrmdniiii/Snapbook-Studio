import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function getAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) return null;
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, sessionVersion: true },
    });
    return admin && admin.sessionVersion === payload.sessionVersion ? admin : null;
  } catch {
    return null;
  }
}
