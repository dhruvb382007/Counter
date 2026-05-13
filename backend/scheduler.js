const cron = require('node-cron');
const { sendWeeklyReport } = require('./email');

cron.schedule('0 20 * * 0', async () => {
  console.log('[Scheduler] Sending weekly report…', new Date().toISOString());
  try {
    const result = await sendWeeklyReport();
    console.log(result.success ? `[Scheduler] ✅ ${result.message}` : `[Scheduler] ❌ ${result.message}`);
  } catch (err) {
    console.error('[Scheduler] ❌ Error:', err.message);
  }
});

console.log('[Scheduler] ✅ Weekly report job registered (Sun 20:00)');
