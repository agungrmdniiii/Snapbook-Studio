import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'snapbook_admin_session';
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && Buffer.byteLength(secret, 'utf8') >= 32 ? secret : null;
}

export interface SessionPayload {
  id: string;
  username: string;
  v: 1;
  iat: number;
  exp: number;
  sessionVersion: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: Pick<SessionPayload, 'id' | 'username'> & { sessionVersion?: number }): string {
  const secret = sessionSecret();
  if (!secret) throw new Error('SESSION_SECRET must contain at least 32 bytes');
  const iat = Date.now();
  const data = JSON.stringify({ v: 1, id: payload.id, username: payload.username, sessionVersion: payload.sessionVersion ?? 0, iat, exp: iat + SESSION_LIFETIME_MS });
  const encodedData = Buffer.from(data).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(encodedData);
  const signature = hmac.digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const secret = sessionSecret();
  if (!secret || typeof token !== 'string' || token.length > 4096) return null;
  const [encodedData, signature, extra] = token.split('.');
  if (!encodedData || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encodedData) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(encodedData);
    const expectedSignature = hmac.digest('base64url');

    if (
      crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      )
    ) {
      const json = Buffer.from(encodedData, 'base64url').toString('utf-8');
      const payload = JSON.parse(json);
      const now = Date.now();
      if (!payload || payload.v !== 1 || typeof payload.id !== 'string' || !payload.id ||
        typeof payload.username !== 'string' || !payload.username ||
        !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) ||
        payload.iat > now || payload.iat < 0 || payload.exp <= now || payload.exp <= payload.iat ||
        payload.exp - payload.iat > SESSION_LIFETIME_MS ||
        !Number.isSafeInteger(payload.sessionVersion) || payload.sessionVersion < 0) return null;
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
