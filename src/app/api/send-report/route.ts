import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { sendWeeklyReport } from '@/lib/email';

export async function POST() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await sendWeeklyReport(user.userId);
    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
