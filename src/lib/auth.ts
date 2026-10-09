import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'snapbook-studio-super-secure-secret-2026';
export const SESSION_COOKIE_NAME = 'snapbook_admin_session';

export interface SessionPayload {
  id: string;
  username: string;
  iat?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: SessionPayload): string {
  const data = JSON.stringify({ ...payload, iat: Date.now() });
  const encodedData = Buffer.from(data).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(encodedData);
  const signature = hmac.digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encodedData, signature] = token.split('.');
  if (!encodedData || !signature) return null;

  try {
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(encodedData);
    const expectedSignature = hmac.digest('base64url');

    if (
      crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      )
    ) {
      const json = Buffer.from(encodedData, 'base64url').toString('utf-8');
      return JSON.parse(json) as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
