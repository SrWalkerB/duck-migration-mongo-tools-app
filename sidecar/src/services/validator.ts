import type { Document, Filter } from 'mongodb';
import { getClient } from './mongo.js';
import { getConnectionById } from './database.js';
import { emitSSE } from '../events/sse.js';
import type { ValidationResult, CollectionMigrationConfig } from '../types/index.js';

const SAMPLE_SIZE = 100;

export async function validateMigration(
  sourceConnectionId: string,
  sourceDatabase: string,
  targetConnectionId: string,
  targetDatabase: string,
  collections: CollectionMigrationConfig[],
): Promise<ValidationResult[]> {
  const sourceConn = getConnectionById(sourceConnectionId);
  const targetConn = getConnectionById(targetConnectionId);

  if (!sourceConn) throw new Error('Conexão de origem não encontrada.');
  if (!targetConn) throw new Error('Conexão de destino não encontrada.');

  const sourceClient = await getClient(sourceConn.connectionString);
  const targetClient = await getClient(targetConn.connectionString);

  const sourceDb = sourceClient.db(sourceDatabase);
  const targetDb = targetClient.db(targetDatabase);

  const results: ValidationResult[] = [];

  for (const col of collections) {
    const filter = (col.filter ?? {}) as Filter<Document>;
    const sourceColl = sourceDb.collection(col.name);
    const targetColl = targetDb.collection(col.name);

    const sourceCount = await sourceColl.countDocuments(filter);
    const targetCount = await targetColl.countDocuments();
    const countMatch = col.conflictStrategy === 'merge'
      ? targetCount >= sourceCount
      : sourceCount === targetCount;

    let sampleChecked = 0;
    let sampleMatched = 0;

    try {
      const sampleDocs = await sourceColl.aggregate([
        ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
        { $sample: { size: SAMPLE_SIZE } },
        { $project: { _id: 1 } },
      ]).toArray();

      sampleChecked = sampleDocs.length;

      for (const doc of sampleDocs) {
        const targetDoc = await targetColl.findOne({ _id: doc._id });
        if (targetDoc) sampleMatched++;
      }
    } catch {
      /* ignore */
    }

    const sampleMatch = sampleChecked > 0 ? sampleMatched === sampleChecked : true;
    const passed = countMatch && sampleMatch;

    const result: ValidationResult = {
      collectionName: col.name,
      sourceCount,
      targetCount,
      countMatch,
      sampleChecked,
      sampleMatched,
      sampleMatch,
      passed,
    };

    results.push(result);
    emitSSE({ type: 'validation:result', data: result });
  }

  return results;
}
