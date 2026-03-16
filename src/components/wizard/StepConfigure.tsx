import { useState } from 'react';
import { Settings, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardState, ConflictStrategy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export interface StepConfigureProps {
  state: WizardState;
  onNext: () => void;
  onPrev: () => void;
  setParallelCollections: (count: number) => void;
  setBatchSize: (size: number) => void;
  setGlobalConflictStrategy: (strategy: ConflictStrategy) => void;
  setGlobalFilter: (filter: string) => void;
}

const conflictStrategies: {
  value: ConflictStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: 'skip',
    label: 'Skip (Pular)',
    description: 'Skip documents that already exist in the target. Safest option.',
  },
  {
    value: 'overwrite',
    label: 'Overwrite (Sobrescrever)',
    description: 'Replace existing documents in the target. Data in target will be lost.',
  },
  {
    value: 'merge',
    label: 'Merge (Mesclar)',
    description: 'Merge fields from source into existing target documents.',
  },
];

export function StepConfigure({
  state,
  setParallelCollections,
  setBatchSize,
  setGlobalConflictStrategy,
  setGlobalFilter,
}: StepConfigureProps) {
  const [filterError, setFilterError] = useState<string | null>(null);

  const validateFilter = (value: string) => {
    if (!value.trim()) {
      setFilterError(null);
      return;
    }
    try {
      JSON.parse(value);
      setFilterError(null);
    } catch {
      setFilterError('Invalid JSON format');
    }
  };

  const selectClasses = cn(
    'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
    'transition-colors cursor-pointer',
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Configure Migration</h2>
        <p className="text-sm text-muted-foreground">
          Fine-tune migration settings for performance and conflict handling.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Parallel Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parallel Collections</CardTitle>
            <CardDescription>
              Number of collections to migrate simultaneously
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <select
                value={state.parallelCollections}
                onChange={(e) => setParallelCollections(Number(e.target.value))}
                className={selectClasses}
              >
                {[1, 2, 4, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'collection' : 'collections'}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Batch Size */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch Size</CardTitle>
            <CardDescription>
              Number of documents processed per batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <select
                value={state.batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className={selectClasses}
              >
                {[500, 1000, 2000, 5000, 10000].map((n) => (
                  <option key={n} value={n}>
                    {n.toLocaleString()} documents
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Conflict Strategy
          </CardTitle>
          <CardDescription>
            How to handle documents that already exist in the target database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conflictStrategies.map((strategy) => (
              <button
                type="button"
                key={strategy.value}
                onClick={() => setGlobalConflictStrategy(strategy.value)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors',
                  'hover:bg-accent/50',
                  state.globalConflictStrategy === strategy.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    state.globalConflictStrategy === strategy.value
                      ? 'border-primary'
                      : 'border-muted-foreground/40',
                  )}
                >
                  {state.globalConflictStrategy === strategy.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {strategy.label}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {strategy.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Filter (Optional)</CardTitle>
          <CardDescription>
            Apply a MongoDB query filter to only migrate matching documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={state.globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            onBlur={() => validateFilter(state.globalFilter)}
            placeholder='{ "status": "active", "createdAt": { "$gte": "2024-01-01" } }'
            rows={4}
            className={cn(
              'w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
              'transition-colors',
              filterError ? 'border-destructive' : 'border-input',
            )}
          />
          {filterError && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {filterError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
