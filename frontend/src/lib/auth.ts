/**
 * Auth helpers: JWT sign/verify + cookie extraction.
 * Uses jsonwebtoken (Node.js runtime only — not Edge).
 */
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET  = process.env.JWT_SECRET  || 'change-this-secret-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
export const COOKIE_NAME = 'auth_token';

export interface JWTPayload {
  userId: string;
  email:  string;
  name:   string;
}

/** Sign a new JWT for the given user. */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
}

/** Verify a JWT. Returns the payload or null if invalid/expired. */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract and verify the auth token from the request cookies.
 * Must be called inside a Next.js Route Handler (server context).
 */
export function getAuthUser(): JWTPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Cookie options shared between login (set) and logout (clear). */
export const cookieOptions = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  'lax' as const,
  maxAge:    60 * 60 * 24 * 7, // 7 days
  path:      '/',
};
