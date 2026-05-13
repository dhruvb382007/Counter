/**
 * API Route: /api/stats
 * Protected — requires valid JWT cookie.
 * Returns daily (last 7 days) and current-week stats for this user via MongoDB aggregation.
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CounterHistory from '@/models/CounterHistory';
import mongoose from 'mongoose';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
}

/** Returns 00:00:00 UTC of `daysAgo` days ago */
function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns Sunday 00:00:00 UTC of the current week */
function startOfCurrentWeek() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const user = getAuthUser();
  if (!user) return unauthorized();

  try {
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    // ── Daily stats (last 7 days) ────────────────────────────────────────────
    const daily = await CounterHistory.aggregate([
      {
        $match: {
          userId:    uid,
          createdAt: { $gte: daysAgo(7) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          max_value:    { $max: '$valueAfter' },
          min_value:    { $min: '$valueAfter' },
          increments:   { $sum: { $cond: [{ $eq: ['$action', 'increment'] }, 1, 0] } },
          decrements:   { $sum: { $cond: [{ $eq: ['$action', 'decrement'] }, 1, 0] } },
          total_actions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', max_value: 1, min_value: 1, increments: 1, decrements: 1, total_actions: 1 } },
    ]);

    // ── Weekly stats (Sun → Sat of the current week) ─────────────────────────
    const weekStart = startOfCurrentWeek();
    const weekEnd   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [weeklyAgg] = await CounterHistory.aggregate([
      { $match: { userId: uid, createdAt: { $gte: weekStart, $lt: weekEnd } } },
      {
        $group: {
          _id:              null,
          max_value:        { $max: '$valueAfter' },
          min_value:        { $min: '$valueAfter' },
          total_increments: { $sum: { $cond: [{ $eq: ['$action', 'increment'] }, 1, 0] } },
          total_decrements: { $sum: { $cond: [{ $eq: ['$action', 'decrement'] }, 1, 0] } },
          total_actions:    { $sum: 1 },
        },
      },
    ]);

    const weekly = weeklyAgg
      ? {
          week_start:       weekStart.toISOString().split('T')[0],
          week_end:         weekEnd.toISOString().split('T')[0],
          max_value:        weeklyAgg.max_value,
          min_value:        weeklyAgg.min_value,
          total_increments: weeklyAgg.total_increments,
          total_decrements: weeklyAgg.total_decrements,
          total_actions:    weeklyAgg.total_actions,
        }
      : null;

    return NextResponse.json({ success: true, data: { daily, weekly } });

  } catch (err: any) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
