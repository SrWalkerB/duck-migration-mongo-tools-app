import { MongoClient } from 'mongodb';
import type { CollectionInfo, ConnectionTestResult, DatabaseInfo } from '../types/index.js';

const clientCache = new Map<string, MongoClient>();

export async function getClient(connectionString: string): Promise<MongoClient> {
  const existing = clientCache.get(connectionString);
  if (existing) {
    try {
      await existing.db('admin').command({ ping: 1 });
      return existing;
    } catch {
      clientCache.delete(connectionString);
      try { await existing.close(); } catch { /* ignore */ }
    }
  }

  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  clientCache.set(connectionString, client);
  return client;
}

export async function testConnection(connectionString: string): Promise<ConnectionTestResult> {
  try {
    const client = await getClient(connectionString);
    const adminDb = client.db('admin');
    await adminDb.command({ ping: 1 });

    const dbs = await client.db().admin().listDatabases();
    const dbNames = dbs.databases
      .map((d: { name: string }) => d.name)
      .filter((name: string) => !['admin', 'local', 'config'].includes(name));

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso!',
      databases: dbNames,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Falha na conexão: ${message}`,
    };
  }
}

export async function listDatabases(connectionString: string): Promise<DatabaseInfo[]> {
  const client = await getClient(connectionString);
  const result = await client.db().admin().listDatabases();

  return result.databases
    .filter((d: { name: string }) => !['admin', 'local', 'config'].includes(d.name))
    .map((d: { name: string; sizeOnDisk?: number; empty?: boolean }) => ({
      name: d.name,
      sizeOnDisk: d.sizeOnDisk ?? 0,
      empty: d.empty ?? false,
    }));
}

export async function listCollections(
  connectionString: string,
  databaseName: string
): Promise<CollectionInfo[]> {
  const client = await getClient(connectionString);
  const db = client.db(databaseName);

  const collections = await db.listCollections().toArray();
  const result: CollectionInfo[] = [];

  for (const col of collections) {
    if (col.name.startsWith('system.')) continue;

    try {
      const stats = await db.command({ collStats: col.name });
      result.push({
        name: col.name,
        documentCount: stats.count ?? 0,
        avgDocumentSize: stats.avgObjSize ?? 0,
        totalSize: stats.totalSize ?? 0,
      });
    } catch {
      result.push({
        name: col.name,
        documentCount: 0,
        avgDocumentSize: 0,
        totalSize: 0,
      });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function closeConnection(connectionString: string): Promise<void> {
  const client = clientCache.get(connectionString);
  if (client) {
    clientCache.delete(connectionString);
    await client.close();
  }
}

export async function closeAllConnections(): Promise<void> {
  const promises = Array.from(clientCache.values()).map(client => client.close());
  clientCache.clear();
  await Promise.allSettled(promises);
}
