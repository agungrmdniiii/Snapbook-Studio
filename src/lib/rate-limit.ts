import crypto from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number): Promise<NextResponse | null> {
  // Vercel overwrites x-real-ip. Elsewhere use one shared bucket until a trusted proxy is configured.
  const forwarded = process.env.VERCEL === '1' ? request.headers.get('x-real-ip') : null;
  const identity = forwarded && isIP(forwarded) ? forwarded : 'local';
  const key = crypto.createHash('sha256').update(`${scope}:${identity}`).digest('hex');
  try {
    const [bucket] = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RequestLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, CURRENT_TIMESTAMP + ${windowSeconds} * INTERVAL '1 second')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RequestLimit"."resetAt" <= CURRENT_TIMESTAMP THEN 1 ELSE LEAST("RequestLimit"."count" + 1, ${limit + 1}) END,
        "resetAt" = CASE WHEN "RequestLimit"."resetAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + ${windowSeconds} * INTERVAL '1 second' ELSE "RequestLimit"."resetAt" END
      RETURNING "count", "resetAt"
    `;
    if (!bucket) throw new Error('Rate limit unavailable');
    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((new Date(bucket.resetAt).getTime() - Date.now()) / 1000));
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Layanan sementara tidak tersedia' }, { status: 503 });
  }
}
