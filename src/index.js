const express = require('express');

const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ hello: 'world' });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on('error', reject);
  });
}

// Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT).then(({ server, port }) => {
    console.log(`Server running on port ${port}`);
    setupGracefulShutdown(server);
  });
}

module.exports = { app, startServer };
