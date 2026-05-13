/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Creates a new user, hashes the password, returns JWT cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth';
import User from '@/models/User';
import Counter from '@/models/Counter';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required.' },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 },
      );
    }

    await connectDB();

    // ── Duplicate check ──────────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    // ── Create user ──────────────────────────────────────────────────────────
    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed });

    // Bootstrap an empty counter document for this user
    await Counter.create({ userId: user._id, value: 0 });

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = signToken({ userId: String(user._id), email: user.email, name: user.name });

    const res = NextResponse.json(
      { success: true, user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 },
    );
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;

  } catch (err: any) {
    console.error('[Register]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Registration failed.' },
      { status: 500 },
    );
  }
}
