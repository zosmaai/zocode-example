'use strict';

const express = require('express');

const app = express();

// ── Routes ───────────────────────────────────────────────
app.get('/api/hello', (_req, res) => {
  res.json({ hello: 'world' });
});

// ── 404 catch-all ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ── Export for testing ───────────────────────────────────
module.exports = app;

// ── Conditional listen (direct execution) ────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    server.close(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    server.close(() => process.exit(0));
  });
}
