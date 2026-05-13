import { NextResponse } from 'next/server';
import { sendWeeklyReport } from '@/lib/email';

export async function GET(request: Request) {
  // Vercel securely passes the CRON_SECRET via the Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calling sendWeeklyReport without arguments sends to ALL users
    const result = await sendWeeklyReport();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
