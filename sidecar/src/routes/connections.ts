import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createConnection,
  getAllConnections,
  getConnectionById,
  updateConnection,
  deleteConnection,
} from '../services/database.js';
import { testConnection, listDatabases, listCollections } from '../services/mongo.js';

const createConnectionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  connectionString: z.string().min(1, 'Connection string é obrigatória'),
});

const updateConnectionSchema = createConnectionSchema;

export async function connectionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/connections', async () => {
    const connections = getAllConnections();
    return connections.map(c => ({
      ...c,
      connectionString: maskConnectionString(c.connectionString),
    }));
  });

  app.get<{ Params: { id: string } }>('/api/connections/:id', async (request, reply) => {
    const conn = getConnectionById(request.params.id);
    if (!conn) {
      return reply.status(404).send({ error: 'Conexão não encontrada' });
    }
    return {
      ...conn,
      connectionString: maskConnectionString(conn.connectionString),
    };
  });

  app.post('/api/connections', async (request, reply) => {
    const parsed = createConnectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name, connectionString } = parsed.data;
    const conn = createConnection(name, connectionString);
    return reply.status(201).send({
      ...conn,
      connectionString: maskConnectionString(conn.connectionString),
    });
  });

  app.put<{ Params: { id: string } }>('/api/connections/:id', async (request, reply) => {
    const parsed = updateConnectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name, connectionString } = parsed.data;
    const conn = updateConnection(request.params.id, name, connectionString);
    if (!conn) {
      return reply.status(404).send({ error: 'Conexão não encontrada' });
    }
    return {
      ...conn,
      connectionString: maskConnectionString(conn.connectionString),
    };
  });

  app.delete<{ Params: { id: string } }>('/api/connections/:id', async (request, reply) => {
    const id = request.params.id;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return reply.status(400).send({ error: 'ID da conexão é obrigatório' });
    }
    const deleted = deleteConnection(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Conexão não encontrada' });
    }
    return reply.status(200).send({ success: true });
  });

  app.post<{ Params: { id: string } }>('/api/connections/:id/test', async (request, reply) => {
    const conn = getConnectionById(request.params.id);
    if (!conn) {
      return reply.status(404).send({ error: 'Conexão não encontrada' });
    }

    const result = await testConnection(conn.connectionString);
    return result;
  });

  app.post('/api/connections/test', async (request) => {
    const parsed = z.object({ connectionString: z.string() }).safeParse(request.body);
    if (!parsed.success) {
      return { success: false, message: 'Connection string é obrigatória' };
    }

    const result = await testConnection(parsed.data.connectionString);
    return result;
  });

  app.get<{ Params: { id: string } }>('/api/connections/:id/databases', async (request, reply) => {
    const conn = getConnectionById(request.params.id);
    if (!conn) {
      return reply.status(404).send({ error: 'Conexão não encontrada' });
    }

    const databases = await listDatabases(conn.connectionString);
    return databases;
  });

  app.get<{ Params: { id: string; database: string } }>(
    '/api/connections/:id/databases/:database/collections',
    async (request, reply) => {
      const conn = getConnectionById(request.params.id);
      if (!conn) {
        return reply.status(404).send({ error: 'Conexão não encontrada' });
      }

      const collections = await listCollections(
        conn.connectionString,
        request.params.database
      );
      return collections;
    }
  );
}

function maskConnectionString(connStr: string): string {
  try {
    return connStr.replace(/:([^@/]+)@/, ':****@');
  } catch {
    return '****';
  }
}
