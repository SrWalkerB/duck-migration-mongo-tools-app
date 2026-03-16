import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { initDatabase, closeDatabase } from './services/database.js';
import { closeAllConnections } from './services/mongo.js';
import { connectionRoutes } from './routes/connections.js';
import { migrationRoutes } from './routes/migration.js';
import { historyRoutes } from './routes/history.js';
import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const PORT = parseInt(process.env.SIDECAR_PORT ?? '45678', 10);
const DATA_DIR = process.env.DUCK_DATA_DIR ?? join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, 'duck-migration.db');

async function main() {
  initDatabase(DB_PATH);
  console.log(`[Duck Migration] SQLite initialized at ${DB_PATH}`);

  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.register(connectionRoutes);
  await app.register(migrationRoutes);
  await app.register(historyRoutes);

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const shutdown = async () => {
    console.log('[Duck Migration] Shutting down...');
    await closeAllConnections();
    closeDatabase();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: PORT, host: '127.0.0.1' });
    console.log(`[Duck Migration] Sidecar running on http://127.0.0.1:${PORT}`);
  } catch (err) {
    console.error('[Duck Migration] Failed to start sidecar:', err);
    process.exit(1);
  }
}

main();
