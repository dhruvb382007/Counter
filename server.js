/**
 * Custom Next.js server that initializes the cron scheduler.
 * This approach allows us to run background jobs (weekly email reports)
 * alongside the Next.js server process.
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize the cron scheduler after Next.js is ready
  try {
    require('./scheduler.js');
    console.log('✅ Cron scheduler initialized');
  } catch (error) {
    console.error('❌ Scheduler init failed:', error.message);
  }

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Request error:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Mode: ${process.env.NODE_ENV || 'development'}`);
  });
});
