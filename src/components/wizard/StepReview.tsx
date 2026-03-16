import {
  Database,
  Server,
  ArrowRight,
  Layers,
  Settings,
  Filter,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardState, Connection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { getConnections } from '@/services/api';

export interface StepReviewProps {
  state: WizardState;
  onNext: () => void;
  onPrev: () => void;
}

const strategyLabels: Record<string, string> = {
  skip: 'Skip (Pular)',
  overwrite: 'Overwrite (Sobrescrever)',
  merge: 'Merge (Mesclar)',
};

export function StepReview({ state, onNext }: StepReviewProps) {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    getConnections()
      .then(setConnections)
      .catch(() => {});
  }, []);

  const sourceName =
    connections.find((c) => c.id === state.sourceConnectionId)?.name ??
    state.sourceConnectionId;
  const targetName =
    connections.find((c) => c.id === state.targetConnectionId)?.name ??
    state.targetConnectionId;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Review Migration</h2>
        <p className="text-sm text-muted-foreground">
          Review your migration settings before starting.
        </p>
      </div>

      {/* Source & Target */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Migration Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Source */}
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-secondary/50 px-4 py-3">
              <Server className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{sourceName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span className="truncate">{state.sourceDatabase}</span>
                </div>
              </div>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />

            {/* Target */}
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-secondary/50 px-4 py-3">
              <Server className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{targetName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span className="truncate">{state.targetDatabase}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            Collections ({state.selectedCollections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {state.selectedCollections.map((col) => (
              <Badge key={col.name} variant="secondary">
                {col.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Parallel Collections</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {state.parallelCollections}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Batch Size</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {state.batchSize.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conflict Strategy</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {strategyLabels[state.globalConflictStrategy]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      {state.globalFilter.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-primary" />
              Document Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-secondary/50 px-4 py-3 font-mono text-xs text-foreground">
              {state.globalFilter}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Overwrite Warning */}
      {state.globalConflictStrategy === 'overwrite' && (
        <div className="flex items-start gap-3 rounded-md border border-warning/50 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">Overwrite Strategy Active</p>
            <p className="mt-0.5 text-xs text-warning/80">
              Existing documents in the target database will be replaced. This action
              cannot be undone. Make sure you have a backup.
            </p>
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={onNext}
          className={cn(
            'gap-2 px-8 text-base font-semibold',
            'shadow-lg shadow-primary/20',
          )}
        >
          <Rocket className="h-5 w-5" />
          Start Migration
        </Button>
      </div>
    </div>
  );
}
