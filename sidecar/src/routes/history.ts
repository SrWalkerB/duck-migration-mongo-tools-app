import type { FastifyInstance } from 'fastify';
import { getAllMigrationHistory, getMigrationHistoryById } from '../services/database.js';

export async function historyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/history', async () => {
    return getAllMigrationHistory();
  });

  app.get<{ Params: { id: string } }>('/api/history/:id', async (request, reply) => {
    const history = getMigrationHistoryById(request.params.id);
    if (!history) {
      return reply.status(404).send({ error: 'Migração não encontrada no histórico.' });
    }
    return history;
  });
}
