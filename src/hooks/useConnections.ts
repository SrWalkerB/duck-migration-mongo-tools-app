import { useState, useEffect, useCallback } from 'react';
import type { Connection } from '../types';
import * as api from '../services/api';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conexões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const addConnection = async (name: string, connectionString: string) => {
    const conn = await api.createConnection(name, connectionString);
    setConnections(prev => [conn, ...prev]);
    return conn;
  };

  const removeConnection = async (id: string) => {
    await api.deleteConnection(id);
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const editConnection = async (id: string, name: string, connectionString: string) => {
    const conn = await api.updateConnection(id, name, connectionString);
    setConnections(prev => prev.map(c => c.id === id ? conn : c));
    return conn;
  };

  return {
    connections,
    loading,
    error,
    fetchConnections,
    addConnection,
    removeConnection,
    editConnection,
  };
}
