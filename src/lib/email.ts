/**
 * Email service — async, uses MongoDB.
 */
import nodemailer from 'nodemailer';
import { connectDB } from './mongodb';
import User from '@/models/User';
import Counter from '@/models/Counter';
import CounterHistory from '@/models/CounterHistory';
import mongoose from 'mongoose';

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

function startOfCurrentWeek() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function sendWeeklyReport(userId?: string): Promise<{ success: boolean; message: string }> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || '';

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, message: 'Email env vars missing (SMTP_USER, SMTP_PASS).' };
  }

  try {
    await connectDB();
    const transporter = createTransporter();
    await transporter.verify();

    // If userId is provided, only send to that user. Otherwise, send to all users.
    const filter = userId ? { _id: new mongoose.Types.ObjectId(userId) } : {};
    const users = await User.find(filter);

    let sentCount = 0;

    for (const user of users) {
      const uid = user._id;
      const counter = await Counter.findOne({ userId: uid });
      if (!counter) continue;

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

      const ws = weeklyAgg || {};
      const max    = ws.max_value        ?? counter.value;
      const min    = ws.min_value        ?? counter.value;
      const incs   = ws.total_increments ?? 0;
      const decs   = ws.total_decrements ?? 0;
      const total  = ws.total_actions    ?? 0;
      const net    = incs - decs;
      const netLbl = net >= 0 ? `+${net}` : `${net}`;

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr   = weekEnd.toISOString().split('T')[0];

      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Weekly Counter Report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f1a;color:#e2e8f0;margin:0;padding:0}
  .wrap{max-width:560px;margin:0 auto;padding:32px 16px}
  h1{font-size:24px;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 4px}
  .sub{color:#64748b;font-size:13px;margin-bottom:28px}
  .card{background:#1e1e2e;border:1px solid #2d2d44;border-radius:16px;padding:22px;margin-bottom:14px}
  .lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#818cf8;margin-bottom:10px}
  .big{font-size:60px;font-weight:800;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;text-align:center}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .stat{background:#252535;border-radius:10px;padding:14px;text-align:center}
  .n{font-size:24px;font-weight:700}.t{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .green{color:#34d399}.red{color:#f87171}
  .foot{text-align:center;color:#475569;font-size:11px;margin-top:28px}
</style></head><body><div class="wrap">
  <h1>📊 Weekly Counter Report</h1>
  <div class="sub">Week of ${weekStartStr} — ${weekEndStr}</div>
  <div class="card"><div class="lbl">Current Value</div><div class="big">${counter.value}</div>
    <p style="text-align:center;color:#64748b;font-size:12px;margin-top:8px">Last updated: ${new Date(counter.updatedAt).toLocaleString()}</p></div>
  <div class="card"><div class="lbl">Weekly Stats</div>
    <div class="grid">
      <div class="stat"><div class="t">Highest</div><div class="n">${max}</div></div>
      <div class="stat"><div class="t">Lowest</div><div class="n">${min}</div></div>
      <div class="stat"><div class="t">Increments</div><div class="n green">+${incs}</div></div>
      <div class="stat"><div class="t">Decrements</div><div class="n red">-${decs}</div></div>
    </div>
  </div>
  <div class="card"><div class="lbl">Summary</div>
    <p style="color:#94a3b8;line-height:1.8;font-size:14px">
      Hi ${user.name}, this week you had <strong style="color:#818cf8">${total} total actions</strong>.
      Range: <strong style="color:#818cf8">${min}</strong> – <strong style="color:#818cf8">${max}</strong>.
      Net change: <strong style="color:#818cf8">${netLbl}</strong>.
      Current value: <strong style="color:#818cf8">${counter.value}</strong>.
    </p>
  </div>
  <div class="foot">Counter App · Auto-sent every Sunday at 8 PM</div>
</div></body></html>`;

      await transporter.sendMail({
        from: `"Counter App" <${from}>`,
        to: user.email,
        subject: `📊 Weekly Counter Report — Week of ${weekStartStr}`,
        html,
      });

      sentCount++;
    }

    return { success: true, message: `Report sent to ${sentCount} user(s)` };
  } catch (err: any) {
    console.error('[Email] Failed:', err);
    return { success: false, message: err.message ?? 'Unknown error' };
  }
}
