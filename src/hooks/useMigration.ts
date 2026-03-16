import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  MigrationProgress,
  CollectionProgress,
  ValidationResult,
  MigrationRequest,
} from '../types';
import * as api from '../services/api';

export function useMigration() {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = api.createSSEConnection(
      (event) => {
        switch (event.type) {
          case 'migration:start':
            setIsRunning(true);
            setError(null);
            break;

          case 'migration:progress': {
            const colProgress = event.data as CollectionProgress;
            setProgress(prev => {
              if (!prev) return prev;
              const collections = prev.collections.map(c =>
                c.name === colProgress.name ? colProgress : c
              );
              const overallProgress = Math.round(
                collections.reduce((sum, c) => sum + c.progress, 0) / collections.length
              );
              return { ...prev, collections, overallProgress };
            });
            break;
          }

          case 'migration:complete': {
            const result = event.data as MigrationProgress;
            setProgress(result);
            setIsRunning(false);
            break;
          }

          case 'migration:error': {
            const errData = event.data as { message: string };
            setError(errData.message);
            break;
          }

          case 'validation:result': {
            const valResult = event.data as ValidationResult;
            setValidationResults(prev => [...prev, valResult]);
            break;
          }
        }
      },
      () => {
        // SSE error - reconnect after delay
        setTimeout(() => {
          if (isRunning) connectSSE();
        }, 3000);
      }
    );

    eventSourceRef.current = es;
  }, [isRunning]);

  const startMigration = async (request: MigrationRequest) => {
    setError(null);
    setValidationResults([]);
    connectSSE();

    try {
      const result = await api.startMigration(request);
      setProgress(result);
      setIsRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar migração');
      setIsRunning(false);
    }
  };

  const cancelMigration = async () => {
    try {
      await api.cancelMigration();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  };

  const runValidation = async (request: {
    sourceConnectionId: string;
    sourceDatabase: string;
    targetConnectionId: string;
    targetDatabase: string;
    collections: { name: string; filter?: Record<string, unknown>; conflictStrategy: string }[];
  }) => {
    try {
      const results = await api.validateMigration(request);
      setValidationResults(results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na validação');
      return [];
    }
  };

  return {
    progress,
    validationResults,
    isRunning,
    error,
    startMigration,
    cancelMigration,
    runValidation,
  };
}
