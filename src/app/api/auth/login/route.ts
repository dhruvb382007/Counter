/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies credentials, returns JWT cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    await connectDB();

    // Find user — select password field explicitly (it's excluded by default in schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      // Generic message to avoid user enumeration
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const token = signToken({ userId: String(user._id), email: user.email, name: user.name });

    const res = NextResponse.json(
      { success: true, user: { id: user._id, name: user.name, email: user.email } },
    );
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;

  } catch (err: any) {
    console.error('[Login]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed.' },
      { status: 500 },
    );
  }
}
