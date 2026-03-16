import { useState } from 'react';
import {
  Plus,
  Plug,
  Pencil,
  Trash2,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnections } from '@/hooks/useConnections';
import { testConnectionById } from '@/services/api';
import type { Connection, ConnectionTestResult } from '@/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConnectionForm } from './ConnectionForm';
import { useLanguage } from '@/hooks/useLanguage';

function maskConnectionString(cs: string): string {
  try {
    const url = new URL(cs);
    if (url.password) {
      url.password = '••••••';
    }
    return url.toString();
  } catch {
    // Fallback: mask anything between :// and @
    return cs.replace(/:\/\/([^@]+)@/, '://••••••@');
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ConnectionList() {
  const { connections, loading, error, addConnection, removeConnection, editConnection } =
    useConnections();

  const { t } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, ConnectionTestResult>
  >({});

  const handleAdd = async (name: string, connectionString: string) => {
    await addConnection(name, connectionString);
  };

  const handleEdit = async (name: string, connectionString: string) => {
    if (!editingConnection) return;
    await editConnection(editingConnection.id, name, connectionString);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await removeConnection(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Falha ao excluir conexão');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const result = await testConnectionById(id);
      setTestResults((prev) => ({ ...prev, [id]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          message: err instanceof Error ? err.message : 'Test failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">
            {t('connections.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('connections.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('connections.subtitle')}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('connections.add')}
        </Button>
      </div>

      {/* Error */}
      {(error || deleteError) && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {deleteError ?? error}
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Database className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium text-foreground">
            {t('connections.emptyTitle')}
          </h3>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            {t('connections.emptyDescription')}
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('connections.add')}
          </Button>
        </div>
      )}

      {/* Connection Cards */}
      <div className="space-y-3">
        {connections.map((conn) => {
          const testResult = testResults[conn.id];
          const isTesting = testingId === conn.id;
          const isDeleting = deletingId === conn.id;
          const isConfirmingDelete = confirmDeleteId === conn.id;

          return (
            <div
              key={conn.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="truncate font-semibold text-foreground">
                      {conn.name}
                    </h3>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">
                    {maskConnectionString(conn.connectionString)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('connections.createdAt')} {formatDate(conn.createdAt)}
                  </p>

                  {/* Test result inline */}
                  {testResult && (
                    <div
                      className={cn(
                        'mt-2 flex items-center gap-1.5 text-xs',
                        testResult.success ? 'text-green-400' : 'text-destructive',
                      )}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {testResult.message}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(conn.id)}
                    loading={isTesting}
                    disabled={isTesting}
                  >
                    <Plug className="h-3.5 w-3.5" />
                    {t('connections.test')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingConnection(conn);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(conn.id)}
                        loading={isDeleting}
                      >
                        {t('connections.confirm')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          setDeleteError(null);
                        }}
                        disabled={isDeleting}
                      >
                        {t('connections.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(conn.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Form */}
      <ConnectionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAdd}
        title="New Connection"
      />

      {/* Edit Form */}
      <ConnectionForm
        isOpen={editingConnection !== null}
        onClose={() => setEditingConnection(null)}
        onSubmit={handleEdit}
        initialData={
          editingConnection
            ? {
                name: editingConnection.name,
                connectionString: editingConnection.connectionString,
              }
            : undefined
        }
        title="Edit Connection"
      />
    </div>
  );
}
