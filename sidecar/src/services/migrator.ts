import { randomUUID } from 'node:crypto';
import type { MongoClient, Document, Filter } from 'mongodb';
import { getClient } from './mongo.js';
import { getConnectionById } from './database.js';
import { saveMigrationHistory } from './database.js';
import { emitSSE } from '../events/sse.js';
import type {
  MigrationRequest,
  MigrationProgress,
  CollectionProgress,
  CollectionMigrationConfig,
  MigrationHistory,
} from '../types/index.js';

let activeMigration: MigrationProgress | null = null;
let cancelRequested = false;

export function getActiveMigration(): MigrationProgress | null {
  return activeMigration;
}

export function cancelMigration(): boolean {
  if (!activeMigration || activeMigration.status !== 'running') return false;
  cancelRequested = true;
  return true;
}

export async function executeMigration(request: MigrationRequest): Promise<MigrationProgress> {
  if (activeMigration?.status === 'running') {
    throw new Error('Já existe uma migração em andamento.');
  }

  cancelRequested = false;

  const sourceConn = getConnectionById(request.sourceConnectionId);
  const targetConn = getConnectionById(request.targetConnectionId);

  if (!sourceConn) throw new Error('Conexão de origem não encontrada.');
  if (!targetConn) throw new Error('Conexão de destino não encontrada.');

  const migrationId = randomUUID();
  const startedAt = new Date().toISOString();

  activeMigration = {
    migrationId,
    status: 'running',
    startedAt,
    collections: request.collections.map(col => ({
      name: col.name,
      status: 'pending',
      totalDocuments: 0,
      migratedDocuments: 0,
      progress: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
    })),
    overallProgress: 0,
  };

  emitSSE({ type: 'migration:start', data: { migrationId } });

  try {
    const sourceClient = await getClient(sourceConn.connectionString);
    const targetClient = await getClient(targetConn.connectionString);

    const sourceDb = sourceClient.db(request.sourceDatabase);
    for (const colProgress of activeMigration.collections) {
      const colConfig = request.collections.find(c => c.name === colProgress.name)!;
      const filter = (colConfig.filter ?? {}) as Filter<Document>;
      colProgress.totalDocuments = await sourceDb.collection(colProgress.name).countDocuments(filter);
    }

    const { parallelCollections } = request;
    const collectionQueue = [...request.collections];

    while (collectionQueue.length > 0 && !cancelRequested) {
      const batch = collectionQueue.splice(0, parallelCollections);

      await Promise.allSettled(
        batch.map(colConfig =>
          migrateCollection(
            sourceClient,
            targetClient,
            request.sourceDatabase,
            request.targetDatabase,
            colConfig,
            request.batchSize,
            migrationId,
          )
        )
      );

      updateOverallProgress();
    }

    activeMigration.status = cancelRequested ? 'cancelled' : 'completed';
    activeMigration.completedAt = new Date().toISOString();

    const hasFailed = activeMigration.collections.some(c => c.status === 'failed');
    const hasCompleted = activeMigration.collections.some(c => c.status === 'completed');
    if (hasFailed && hasCompleted) {
      activeMigration.status = 'failed';
    } else if (hasFailed) {
      activeMigration.status = 'failed';
    }

    emitSSE({ type: 'migration:complete', data: activeMigration });

    const history: MigrationHistory = {
      id: migrationId,
      sourceConnection: sourceConn.name,
      sourceDatabase: request.sourceDatabase,
      targetConnection: targetConn.name,
      targetDatabase: request.targetDatabase,
      collections: request.collections.map(c => c.name),
      totalDocumentsMigrated: activeMigration.collections.reduce(
        (sum, c) => sum + c.migratedDocuments, 0
      ),
      status: activeMigration.status === 'completed' ? 'completed' :
              (hasCompleted && hasFailed) ? 'partial' : 'failed',
      startedAt,
      completedAt: activeMigration.completedAt,
      durationMs: new Date(activeMigration.completedAt).getTime() - new Date(startedAt).getTime(),
    };
    saveMigrationHistory(history);

    return activeMigration;
  } catch (error) {
    activeMigration.status = 'failed';
    activeMigration.completedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    emitSSE({ type: 'migration:error', data: { message } });
    throw error;
  }
}

async function migrateCollection(
  sourceClient: MongoClient,
  targetClient: MongoClient,
  sourceDbName: string,
  targetDbName: string,
  config: CollectionMigrationConfig,
  batchSize: number,
  _migrationId: string,
): Promise<void> {
  const colProgress = activeMigration!.collections.find(c => c.name === config.name)!;
  colProgress.status = 'running';

  const sourceDb = sourceClient.db(sourceDbName);
  const targetDb = targetClient.db(targetDbName);
  const sourceCollection = sourceDb.collection(config.name);
  const targetCollection = targetDb.collection(config.name);

  try {
    const existingCollections = await targetDb.listCollections({ name: config.name }).toArray();
    const exists = existingCollections.length > 0;

    if (exists) {
      switch (config.conflictStrategy) {
        case 'skip':
          colProgress.status = 'skipped';
          colProgress.progress = 100;
          emitSSE({
            type: 'migration:collection:complete',
            data: { name: config.name, documentsCount: 0 },
          });
          return;

        case 'overwrite':
          await targetCollection.drop();
          break;

        case 'merge':
          break;
      }
    }

    const filter = (config.filter ?? {}) as Filter<Document>;
    const cursor = sourceCollection.find(filter);

    let batch: Document[] = [];
    let docsProcessed = 0;
    const startTime = Date.now();

    for await (const doc of cursor) {
      if (cancelRequested) {
        colProgress.status = 'failed';
        colProgress.error = 'Migração cancelada pelo usuário.';
        await cursor.close();
        return;
      }

      batch.push(doc);

      if (batch.length >= batchSize) {
        await insertBatch(targetCollection, batch, config.conflictStrategy === 'merge');
        docsProcessed += batch.length;
        batch = [];

        const elapsed = (Date.now() - startTime) / 1000;
        colProgress.migratedDocuments = docsProcessed;
        colProgress.progress = colProgress.totalDocuments > 0
          ? Math.round((docsProcessed / colProgress.totalDocuments) * 100)
          : 0;
        colProgress.speed = elapsed > 0 ? Math.round(docsProcessed / elapsed) : 0;
        colProgress.estimatedTimeRemaining = colProgress.speed > 0
          ? Math.round((colProgress.totalDocuments - docsProcessed) / colProgress.speed)
          : 0;

        emitSSE({ type: 'migration:progress', data: { ...colProgress } });
        updateOverallProgress();
      }
    }

    if (batch.length > 0) {
      await insertBatch(targetCollection, batch, config.conflictStrategy === 'merge');
      docsProcessed += batch.length;
    }

    colProgress.migratedDocuments = docsProcessed;
    colProgress.progress = 100;
    colProgress.status = 'completed';

    emitSSE({
      type: 'migration:collection:complete',
      data: { name: config.name, documentsCount: docsProcessed },
    });
    emitSSE({ type: 'migration:progress', data: { ...colProgress } });
  } catch (error) {
    colProgress.status = 'failed';
    colProgress.error = error instanceof Error ? error.message : 'Erro desconhecido';
    emitSSE({
      type: 'migration:error',
      data: { message: colProgress.error!, collection: config.name },
    });
  }
}

async function insertBatch(
  collection: ReturnType<ReturnType<MongoClient['db']>['collection']>,
  docs: Document[],
  mergeMode: boolean,
): Promise<void> {
  if (mergeMode) {
    try {
      await collection.insertMany(docs, { ordered: false });
    } catch (error: unknown) {
      const mongoError = error as { code?: number };
      if (mongoError.code !== 11000) throw error;
    }
  } else {
    await collection.insertMany(docs, { ordered: true });
  }
}

function updateOverallProgress(): void {
  if (!activeMigration) return;

  const total = activeMigration.collections.length;
  if (total === 0) return;

  const sum = activeMigration.collections.reduce((acc, c) => acc + c.progress, 0);
  activeMigration.overallProgress = Math.round(sum / total);
}
