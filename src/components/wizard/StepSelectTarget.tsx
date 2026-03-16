import { useState, useEffect } from 'react';
import { Database, Server, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardState, Connection, DatabaseInfo } from '@/types';
import { getConnections, getDatabases } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export interface StepSelectTargetProps {
  state: WizardState;
  onNext: () => void;
  onPrev: () => void;
  setTarget: (connectionId: string, database: string) => void;
}

export function StepSelectTarget({ state, setTarget }: StepSelectTargetProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSameSourceAndTarget =
    state.targetConnectionId &&
    state.targetDatabase &&
    state.targetConnectionId === state.sourceConnectionId &&
    state.targetDatabase === state.sourceDatabase;

  useEffect(() => {
    let cancelled = false;
    setLoadingConnections(true);
    setError(null);

    getConnections()
      .then((data) => {
        if (!cancelled) setConnections(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load connections');
      })
      .finally(() => {
        if (!cancelled) setLoadingConnections(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!state.targetConnectionId) {
      setDatabases([]);
      return;
    }

    let cancelled = false;
    setLoadingDatabases(true);
    setError(null);

    getDatabases(state.targetConnectionId)
      .then((data) => {
        if (!cancelled) setDatabases(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load databases');
      })
      .finally(() => {
        if (!cancelled) setLoadingDatabases(false);
      });

    return () => { cancelled = true; };
  }, [state.targetConnectionId]);

  const handleConnectionChange = (connectionId: string) => {
    setTarget(connectionId, '');
  };

  const handleDatabaseChange = (database: string) => {
    setTarget(state.targetConnectionId, database);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Select Target</h2>
        <p className="text-sm text-muted-foreground">
          Choose the target MongoDB connection and database to migrate to.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isSameSourceAndTarget && (
        <div className="flex items-start gap-3 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Source and target are the same connection and database. This may cause
            data conflicts. Consider using a different database.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Connection
          </CardTitle>
          <CardDescription>Select the MongoDB server to write to</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConnections ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              Loading connections...
            </div>
          ) : (
            <div className="relative">
              <select
                value={state.targetConnectionId}
                onChange={(e) => handleConnectionChange(e.target.value)}
                className={cn(
                  'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
                  'transition-colors cursor-pointer',
                )}
              >
                <option value="">Select a connection...</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {state.targetConnectionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database
            </CardTitle>
            <CardDescription>Select the database to migrate to</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDatabases ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Loading databases...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={state.targetDatabase}
                  onChange={(e) => handleDatabaseChange(e.target.value)}
                  className={cn(
                    'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
                    'transition-colors cursor-pointer',
                  )}
                >
                  <option value="">Select a database...</option>
                  {databases.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
