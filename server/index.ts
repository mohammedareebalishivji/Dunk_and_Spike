import { RealtimeServer } from './realtimeServer.ts';

const PORT = Number(process.env.PORT || process.env.REALTIME_PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';

const server = new RealtimeServer({ port: PORT, host: HOST });

server.start().then(() => {
  console.log(`=======================================================`);
  console.log(`⚡ DUNK & SPIKE REALTIME TOURNAMENT DATABASE ACTIVE`);
  console.log(`   HTTP Endpoint: http://${HOST}:${PORT}`);
  console.log(`   WebSocket URL: ws://${HOST}:${PORT}/ws`);
  console.log(`   Database:      SQLite 3 (WAL mode) · data/tournament.db`);
  console.log(`=======================================================`);
}).catch((err) => {
  console.error('[RealtimeServer] Failed to start:', err);
  process.exit(1);
});

// Clean shutdown signals
process.on('SIGINT', async () => {
  console.log('\n[RealtimeServer] Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});
