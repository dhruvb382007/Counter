/**
 * Plain-JS scheduler shim — required by server.js at startup.
 * Dynamically imports the compiled TypeScript email service via Next.js bundler
 * and schedules the weekly report cron job.
 */
const cron = require('node-cron');

// Every Sunday at 20:00 (8 PM) in your local server timezone
cron.schedule('0 20 * * 0', async () => {
  console.log('[Scheduler] Sending weekly report…', new Date().toISOString());
  try {
    // Dynamically require via the Next.js compiled output at runtime
    const { sendWeeklyReport } = await import('./src/lib/email.ts');
    const result = await sendWeeklyReport();
    console.log(result.success
      ? `[Scheduler] ✅ ${result.message}`
      : `[Scheduler] ❌ ${result.message}`
    );
  } catch (err) {
    console.error('[Scheduler] ❌ Error:', err.message);
  }
});

console.log('[Scheduler] ✅ Weekly report job registered (Sun 20:00)');

module.exports = {};
