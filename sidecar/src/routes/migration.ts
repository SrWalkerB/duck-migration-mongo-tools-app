import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { executeMigration, getActiveMigration, cancelMigration } from '../services/migrator.js';
import { validateMigration } from '../services/validator.js';
import { addSSEClient } from '../events/sse.js';
import type { MigrationRequest, CollectionMigrationConfig } from '../types/index.js';

const conflictStrategyEnum = z.enum(['skip', 'overwrite', 'merge']);

const collectionConfigSchema = z.object({
  name: z.string().min(1),
  filter: z.record(z.unknown()).optional(),
  conflictStrategy: conflictStrategyEnum,
});

const migrationRequestSchema = z.object({
  sourceConnectionId: z.string().uuid(),
  sourceDatabase: z.string().min(1),
  targetConnectionId: z.string().uuid(),
  targetDatabase: z.string().min(1),
  collections: z.array(collectionConfigSchema).min(1, 'Selecione pelo menos uma collection'),
  parallelCollections: z.number().int().min(1).max(16).default(1),
  batchSize: z.number().int().min(100).max(10000).default(1000),
});

const validateRequestSchema = z.object({
  sourceConnectionId: z.string().uuid(),
  sourceDatabase: z.string().min(1),
  targetConnectionId: z.string().uuid(),
  targetDatabase: z.string().min(1),
  collections: z.array(collectionConfigSchema),
});

export async function migrationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/migration/events', async (request, reply) => {
    addSSEClient(reply);
    return reply;
  });

  app.post('/api/migration/start', async (request, reply) => {
    const parsed = migrationRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const active = getActiveMigration();
    if (active?.status === 'running') {
      return reply.status(409).send({
        error: 'Já existe uma migração em andamento. Cancele-a primeiro.',
      });
    }

    try {
      const migrationPromise = executeMigration(parsed.data as MigrationRequest);
      const migration = getActiveMigration();
      reply.status(202).send(migration);
      await migrationPromise;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return reply.status(500).send({ error: message });
    }
  });

  app.get('/api/migration/status', async () => {
    const migration = getActiveMigration();
    if (!migration) {
      return { status: 'idle', message: 'Nenhuma migração em andamento.' };
    }
    return migration;
  });

  app.post('/api/migration/cancel', async (_request, reply) => {
    const cancelled = cancelMigration();
    if (!cancelled) {
      return reply.status(400).send({
        error: 'Nenhuma migração ativa para cancelar.',
      });
    }
    return { success: true, message: 'Cancelamento solicitado.' };
  });

  app.post('/api/migration/validate', async (request, reply) => {
    const parsed = validateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const results = await validateMigration(
        parsed.data.sourceConnectionId,
        parsed.data.sourceDatabase,
        parsed.data.targetConnectionId,
        parsed.data.targetDatabase,
        parsed.data.collections as CollectionMigrationConfig[],
      );
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return reply.status(500).send({ error: message });
    }
  });
}
