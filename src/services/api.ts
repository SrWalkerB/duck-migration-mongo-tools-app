// =====================================================
// Duck Migration - API Client
// Comunicação HTTP com o sidecar Node.js.
// =====================================================

import type {
  Connection,
  ConnectionTestResult,
  DatabaseInfo,
  CollectionInfo,
  MigrationRequest,
  MigrationProgress,
  MigrationHistory,
  ValidationResult,
} from '../types';

const BASE_URL = 'http://127.0.0.1:45678';

// --- Helpers ---

function getErrorMessage(error: unknown, status: number): string {
  if (error !== null && typeof error === 'object' && 'error' in error) {
    const err = (error as { error: unknown }).error;
    if (typeof err === 'string') return err;
    if (err !== null && typeof err === 'object') {
      const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
      const msgs = [...(flat.formErrors ?? [])];
      Object.values(flat.fieldErrors ?? {}).flat().forEach(m => msgs.push(m));
      if (msgs.length > 0) return msgs.join('. ');
    }
  }
  return `HTTP ${status}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody =
    options !== undefined &&
    'body' in options &&
    options.body !== undefined &&
    options.body !== null;

  const headers: HeadersInit = hasBody
    ? { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }
    : options?.headers ?? {};

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(body, response.status));
  }

  const text = await response.text();
  if (text.trim() === '') return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

// --- Health ---

export async function healthCheck(): Promise<{ status: string }> {
  return request('/api/health');
}

// --- Conexões ---

export async function getConnections(): Promise<Connection[]> {
  return request('/api/connections');
}

export async function getConnection(id: string): Promise<Connection> {
  return request(`/api/connections/${id}`);
}

export async function createConnection(name: string, connectionString: string): Promise<Connection> {
  return request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({ name, connectionString }),
  });
}

export async function updateConnection(id: string, name: string, connectionString: string): Promise<Connection> {
  return request(`/api/connections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, connectionString }),
  });
}

export async function deleteConnection(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new Error('ID da conexão é obrigatório');
  }
  await request<void>(`/api/connections/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function testConnectionById(id: string): Promise<ConnectionTestResult> {
  return request(`/api/connections/${id}/test`, { method: 'POST' });
}

export async function testConnectionDirect(connectionString: string): Promise<ConnectionTestResult> {
  return request('/api/connections/test', {
    method: 'POST',
    body: JSON.stringify({ connectionString }),
  });
}

// --- Databases & Collections ---

export async function getDatabases(connectionId: string): Promise<DatabaseInfo[]> {
  return request(`/api/connections/${connectionId}/databases`);
}

export async function getCollections(connectionId: string, database: string): Promise<CollectionInfo[]> {
  return request(`/api/connections/${connectionId}/databases/${database}/collections`);
}

// --- Migração ---

export async function startMigration(req: MigrationRequest): Promise<MigrationProgress> {
  return request('/api/migration/start', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getMigrationStatus(): Promise<MigrationProgress | { status: 'idle' }> {
  return request('/api/migration/status');
}

export async function cancelMigration(): Promise<void> {
  await request('/api/migration/cancel', { method: 'POST' });
}

export async function validateMigration(req: {
  sourceConnectionId: string;
  sourceDatabase: string;
  targetConnectionId: string;
  targetDatabase: string;
  collections: { name: string; filter?: Record<string, unknown>; conflictStrategy: string }[];
}): Promise<ValidationResult[]> {
  return request('/api/migration/validate', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// --- Histórico ---

export async function getMigrationHistory(): Promise<MigrationHistory[]> {
  return request('/api/history');
}

export async function getMigrationHistoryById(id: string): Promise<MigrationHistory> {
  return request(`/api/history/${id}`);
}

// --- SSE (Server-Sent Events) ---

export function createSSEConnection(
  onEvent: (event: { type: string; data: unknown }) => void,
  onError?: (error: Event) => void,
): EventSource {
  const eventSource = new EventSource(`${BASE_URL}/api/migration/events`);

  const eventTypes = [
    'migration:start',
    'migration:progress',
    'migration:collection:complete',
    'migration:complete',
    'migration:error',
    'validation:result',
  ];

  for (const type of eventTypes) {
    eventSource.addEventListener(type, (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ type, data });
      } catch {
        console.error('Failed to parse SSE event:', event.data);
      }
    });
  }

  if (onError) {
    eventSource.onerror = onError;
  }

  return eventSource;
}
