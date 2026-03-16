export interface ConnectionConfig {
  id: string;
  name: string;
  connectionString: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  databases?: string[];
}

export interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export interface CollectionInfo {
  name: string;
  documentCount: number;
  avgDocumentSize: number;
  totalSize: number;
}

export type ConflictStrategy = 'skip' | 'overwrite' | 'merge';

export interface MigrationRequest {
  sourceConnectionId: string;
  sourceDatabase: string;
  targetConnectionId: string;
  targetDatabase: string;
  collections: CollectionMigrationConfig[];
  parallelCollections: number;
  batchSize: number;
}

export interface CollectionMigrationConfig {
  name: string;
  filter?: Record<string, unknown>;
  conflictStrategy: ConflictStrategy;
}

export interface MigrationProgress {
  migrationId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  collections: CollectionProgress[];
  overallProgress: number;
}

export interface CollectionProgress {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  totalDocuments: number;
  migratedDocuments: number;
  progress: number;
  speed: number;
  estimatedTimeRemaining: number;
  error?: string;
}

export interface ValidationResult {
  collectionName: string;
  sourceCount: number;
  targetCount: number;
  countMatch: boolean;
  sampleChecked: number;
  sampleMatched: number;
  sampleMatch: boolean;
  passed: boolean;
}

export interface MigrationHistory {
  id: string;
  sourceConnection: string;
  sourceDatabase: string;
  targetConnection: string;
  targetDatabase: string;
  collections: string[];
  totalDocumentsMigrated: number;
  status: 'completed' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  validationResults?: ValidationResult[];
}

export type SSEEvent =
  | { type: 'migration:start'; data: { migrationId: string } }
  | { type: 'migration:progress'; data: CollectionProgress }
  | { type: 'migration:collection:complete'; data: { name: string; documentsCount: number } }
  | { type: 'migration:complete'; data: MigrationProgress }
  | { type: 'migration:error'; data: { message: string; collection?: string } }
  | { type: 'validation:result'; data: ValidationResult };
