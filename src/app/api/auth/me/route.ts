/**
 * GET /api/auth/me
 * Returns current authenticated user info from JWT cookie.
 * Frontend calls this on mount to restore session.
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }
  return NextResponse.json({ success: true, user });
}
