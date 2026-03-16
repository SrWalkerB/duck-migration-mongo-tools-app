import { useState, useEffect, useMemo } from 'react';
import { Search, Layers, CheckSquare, Square } from 'lucide-react';
import { cn, formatBytes, formatNumber } from '@/lib/utils';
import type { WizardState, CollectionInfo, CollectionMigrationConfig } from '@/types';
import { getCollections } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export interface StepSelectCollectionsProps {
  state: WizardState;
  onNext: () => void;
  onPrev: () => void;
  setSelectedCollections: (collections: CollectionMigrationConfig[]) => void;
}

export function StepSelectCollections({
  state,
  setSelectedCollections,
}: StepSelectCollectionsProps) {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedNames = useMemo(
    () => new Set(state.selectedCollections.map((c) => c.name)),
    [state.selectedCollections],
  );

  useEffect(() => {
    if (!state.sourceConnectionId || !state.sourceDatabase) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCollections(state.sourceConnectionId, state.sourceDatabase)
      .then((data) => {
        if (!cancelled) setCollections(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load collections');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [state.sourceConnectionId, state.sourceDatabase]);

  const filtered = useMemo(
    () =>
      collections.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [collections, search],
  );

  const toggleCollection = (name: string) => {
    if (selectedNames.has(name)) {
      setSelectedCollections(
        state.selectedCollections.filter((c) => c.name !== name),
      );
    } else {
      setSelectedCollections([
        ...state.selectedCollections,
        { name, conflictStrategy: state.globalConflictStrategy },
      ]);
    }
  };

  const selectAll = () => {
    setSelectedCollections(
      collections.map((c) => ({
        name: c.name,
        conflictStrategy: state.globalConflictStrategy,
      })),
    );
  };

  const deselectAll = () => {
    setSelectedCollections([]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Select Collections</h2>
        <p className="text-sm text-muted-foreground">
          Choose which collections to migrate from{' '}
          <span className="font-medium text-foreground">{state.sourceDatabase}</span>.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Collections
              </CardTitle>
              <CardDescription>
                {selectedNames.size} of {collections.length} collections selected
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={loading}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={loading}
              >
                <Square className="h-3.5 w-3.5" />
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
                'transition-colors',
              )}
            />
          </div>

          {/* Collection list */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Spinner size="sm" />
              Loading collections...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'No collections match your filter.' : 'No collections found.'}
            </div>
          ) : (
            <div className="max-h-[400px] space-y-1 overflow-y-auto pr-1">
              {filtered.map((col) => {
                const isSelected = selectedNames.has(col.name);
                return (
                  <button
                    type="button"
                    key={col.name}
                    onClick={() => toggleCollection(col.name)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                      'hover:bg-accent/50',
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'border border-transparent',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40',
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                          role="img"
                          aria-label="Selected"
                        >
                          <title>Selected</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                      <span className="truncate text-sm font-medium text-foreground">
                        {col.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatNumber(col.documentCount)} docs</span>
                        <span>{formatBytes(col.totalSize)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
