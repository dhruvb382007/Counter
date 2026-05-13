/**
 * API Route: /api/counter
 * Protected — requires valid JWT cookie.
 *
 * GET  → returns this user's current counter value
 * POST → { action: 'increment' | 'decrement' | 'reset' } — updates & saves to MongoDB
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Counter from '@/models/Counter';
import CounterHistory from '@/models/CounterHistory';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
}

export async function GET() {
  const user = getAuthUser();
  if (!user) return unauthorized();

  try {
    await connectDB();

    // findOneAndUpdate with upsert ensures a doc exists even on first load
    const counter = await Counter.findOneAndUpdate(
      { userId: user.userId },
      { $setOnInsert: { value: 0 } },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      success: true,
      data: { value: counter.value, updated_at: counter.updatedAt },
    });
  } catch (err: any) {
    console.error('[GET /api/counter]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser();
  if (!user) return unauthorized();

  try {
    const { action } = await req.json() as { action: 'increment' | 'decrement' | 'reset' };
    if (!['increment', 'decrement', 'reset'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }

    await connectDB();

    // Fetch current value
    const current = await Counter.findOneAndUpdate(
      { userId: user.userId },
      { $setOnInsert: { value: 0 } },
      { upsert: true, new: true },
    );

    const oldValue = current.value;
    const newValue =
      action === 'increment' ? oldValue + 1
      : action === 'decrement' ? oldValue - 1
      : 0;

    // Save new value
    const updated = await Counter.findOneAndUpdate(
      { userId: user.userId },
      { $set: { value: newValue } },
      { new: true },
    );

    // Record history for stats
    await CounterHistory.create({
      userId:      user.userId,
      action,
      valueBefore: oldValue,
      valueAfter:  newValue,
    });

    return NextResponse.json({
      success: true,
      data: { value: updated!.value, updated_at: updated!.updatedAt },
    });
  } catch (err: any) {
    console.error('[POST /api/counter]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
