/**
 * Cron scheduler — imported once by server.js at startup.
 * Weekly report: every Sunday at 20:00 (8 PM).
 */
import cron from 'node-cron';
import { sendWeeklyReport } from './email';

// "0 20 * * 0" = minute 0, hour 20, any day/month, weekday Sunday
cron.schedule('0 20 * * 0', async () => {
  console.log('[Scheduler] Sending weekly report…', new Date().toISOString());
  const result = await sendWeeklyReport();
  if (result.success) {
    console.log('[Scheduler] ✅', result.message);
  } else {
    console.error('[Scheduler] ❌', result.message);
  }
}, { timezone: 'Asia/Kolkata' }); // adjust to your timezone

console.log('[Scheduler] Weekly report job registered (Sun 20:00)');
