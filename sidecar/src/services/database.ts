import Database from 'better-sqlite3';
import { randomUUID, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import type { ConnectionConfig, MigrationHistory, ValidationResult } from '../types/index.js';

const ENCRYPTION_PASSPHRASE = process.env.DUCK_ENCRYPTION_PASSPHRASE ?? 'duck-migration-local-key';
const ENCRYPTION_KEY = scryptSync(ENCRYPTION_PASSPHRASE, 'salt-duck', 32);
const ALGORITHM = 'aes-256-cbc';

let db: Database.Database;

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function initDatabase(dbPath: string): void {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      connection_string TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS migration_history (
      id TEXT PRIMARY KEY,
      source_connection TEXT NOT NULL,
      source_database TEXT NOT NULL,
      target_connection TEXT NOT NULL,
      target_database TEXT NOT NULL,
      collections TEXT NOT NULL,
      total_documents_migrated INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      validation_results TEXT
    );
  `);
}

export function createConnection(name: string, connectionString: string): ConnectionConfig {
  const id = randomUUID();
  const now = new Date().toISOString();
  const encryptedConnStr = encrypt(connectionString);

  db.prepare(
    'INSERT INTO connections (id, name, connection_string, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, encryptedConnStr, now, now);

  return { id, name, connectionString, createdAt: now, updatedAt: now };
}

export function getAllConnections(): ConnectionConfig[] {
  const rows = db.prepare('SELECT * FROM connections ORDER BY created_at DESC').all() as Array<{
    id: string;
    name: string;
    connection_string: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    connectionString: decrypt(row.connection_string),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getConnectionById(id: string): ConnectionConfig | null {
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as {
    id: string;
    name: string;
    connection_string: string;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    connectionString: decrypt(row.connection_string),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updateConnection(id: string, name: string, connectionString: string): ConnectionConfig | null {
  const existing = getConnectionById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const encryptedConnStr = encrypt(connectionString);

  db.prepare(
    'UPDATE connections SET name = ?, connection_string = ?, updated_at = ? WHERE id = ?'
  ).run(name, encryptedConnStr, now, id);

  return { id, name, connectionString, createdAt: existing.createdAt, updatedAt: now };
}

export function deleteConnection(id: string): boolean {
  const result = db.prepare('DELETE FROM connections WHERE id = ?').run(id);
  return result.changes > 0;
}

export function saveMigrationHistory(history: MigrationHistory): void {
  db.prepare(`
    INSERT INTO migration_history (
      id, source_connection, source_database, target_connection, target_database,
      collections, total_documents_migrated, status, started_at, completed_at,
      duration_ms, validation_results
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    history.id,
    history.sourceConnection,
    history.sourceDatabase,
    history.targetConnection,
    history.targetDatabase,
    JSON.stringify(history.collections),
    history.totalDocumentsMigrated,
    history.status,
    history.startedAt,
    history.completedAt,
    history.durationMs,
    history.validationResults ? JSON.stringify(history.validationResults) : null,
  );
}

export function getAllMigrationHistory(): MigrationHistory[] {
  const rows = db.prepare(
    'SELECT * FROM migration_history ORDER BY started_at DESC'
  ).all() as Array<Record<string, unknown>>;

  return rows.map(row => ({
    id: row.id as string,
    sourceConnection: row.source_connection as string,
    sourceDatabase: row.source_database as string,
    targetConnection: row.target_connection as string,
    targetDatabase: row.target_database as string,
    collections: JSON.parse(row.collections as string) as string[],
    totalDocumentsMigrated: row.total_documents_migrated as number,
    status: row.status as MigrationHistory['status'],
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string,
    durationMs: row.duration_ms as number,
    validationResults: row.validation_results
      ? (JSON.parse(row.validation_results as string) as ValidationResult[])
      : undefined,
  }));
}

export function getMigrationHistoryById(id: string): MigrationHistory | null {
  const row = db.prepare('SELECT * FROM migration_history WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    sourceConnection: row.source_connection as string,
    sourceDatabase: row.source_database as string,
    targetConnection: row.target_connection as string,
    targetDatabase: row.target_database as string,
    collections: JSON.parse(row.collections as string) as string[],
    totalDocumentsMigrated: row.total_documents_migrated as number,
    status: row.status as MigrationHistory['status'],
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string,
    durationMs: row.duration_ms as number,
    validationResults: row.validation_results
      ? (JSON.parse(row.validation_results as string) as ValidationResult[])
      : undefined,
  };
}

export function closeDatabase(): void {
  if (db) db.close();
}
