const nodemailer = require('nodemailer');
const User = require('./models/User');
const Counter = require('./models/Counter');
const CounterHistory = require('./models/CounterHistory');

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

async function sendWeeklyReport() {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || '';

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, message: 'Email env vars missing.' };
  }

  try {
    const transporter = createTransporter();
    const users = await User.find({});
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

      const html = `<h2>Weekly Report for ${user.name}</h2><p>Counter: ${counter.value}</p><p>Total actions: ${total}</p>`;

      await transporter.sendMail({
        from: `"Counter App" <${from}>`,
        to: user.email,
        subject: `📊 Weekly Counter Report`,
        html,
      });
      sentCount++;
    }

    return { success: true, message: `Report sent to ${sentCount} user(s)` };
  } catch (err) {
    console.error('[Email] Failed:', err);
    return { success: false, message: err.message };
  }
}

module.exports = { sendWeeklyReport };
