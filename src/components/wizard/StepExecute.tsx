import {
  Play,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Pause,
} from 'lucide-react';
import { cn, formatNumber, formatDuration } from '@/lib/utils';
import type { WizardState, MigrationProgress, ValidationResult, CollectionProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

export interface StepExecuteProps {
  state: WizardState;
  onNext: () => void;
  onPrev: () => void;
  progress: MigrationProgress | null;
  isRunning: boolean;
  error: string | null;
  validationResults: ValidationResult[];
  onStartMigration: () => void;
  onCancel: () => void;
  onValidate: () => void;
  onReset: () => void;
}

const statusConfig: Record<
  CollectionProgress['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'outline'; icon: React.ElementType }
> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  running: { label: 'Running', variant: 'default', icon: Loader2 },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
  skipped: { label: 'Skipped', variant: 'warning', icon: Pause },
};

export function StepExecute({
  progress,
  isRunning,
  error,
  validationResults,
  onStartMigration,
  onCancel,
  onValidate,
  onReset,
}: StepExecuteProps) {
  const isCompleted = progress?.status === 'completed';
  const isFailed = progress?.status === 'failed';
  const isCancelled = progress?.status === 'cancelled';
  const isFinished = isCompleted || isFailed || isCancelled;

  const completedCollections =
    progress?.collections.filter((c) => c.status === 'completed').length ?? 0;
  const failedCollections =
    progress?.collections.filter((c) => c.status === 'failed').length ?? 0;
  const totalCollections = progress?.collections.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {!progress
            ? 'Execute Migration'
            : isRunning
              ? 'Migration in Progress...'
              : isCompleted
                ? 'Migration Complete'
                : isFailed
                  ? 'Migration Failed'
                  : 'Migration Cancelled'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {!progress
            ? 'Ready to start the migration process.'
            : isRunning
              ? 'Documents are being migrated. Please do not close the application.'
              : 'Review the migration results below.'}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Not started */}
      {!progress && !isRunning && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Ready to Migrate</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click the button below to begin the migration process.
              </p>
            </div>
            <Button size="lg" onClick={onStartMigration} className="gap-2 px-8">
              <Play className="h-4 w-4" />
              Start Migration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overall progress */}
      {progress && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Overall Progress</CardTitle>
                {isRunning && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onCancel}
                    className="gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel Migration
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ProgressBar
                value={progress.overallProgress}
                size="lg"
                color={
                  isFailed
                    ? 'var(--color-destructive)'
                    : isCancelled
                      ? 'var(--color-warning)'
                      : undefined
                }
              />

              {isFinished && (
                <div className="mt-4 flex items-center gap-4 text-sm">
                  {completedCollections > 0 && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      {completedCollections} completed
                    </div>
                  )}
                  {failedCollections > 0 && (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {failedCollections} failed
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {totalCollections} total collections
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-collection progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection Progress</CardTitle>
              <CardDescription>
                Status of each collection being migrated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progress.collections.map((col) => {
                  const config = statusConfig[col.status];
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={col.name}
                      className="rounded-md border border-border bg-secondary/30 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {col.name}
                          </span>
                          <Badge
                            variant={config.variant}
                            className="shrink-0 gap-1"
                          >
                            <StatusIcon
                              className={cn(
                                'h-3 w-3',
                                col.status === 'running' && 'animate-spin',
                              )}
                            />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {formatNumber(col.migratedDocuments)} / {formatNumber(col.totalDocuments)}
                          </span>
                          {col.status === 'running' && col.speed > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Zap className="h-3 w-3" />
                              {formatNumber(Math.round(col.speed))} docs/s
                            </span>
                          )}
                          {col.status === 'running' && col.estimatedTimeRemaining > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(col.estimatedTimeRemaining)}
                            </span>
                          )}
                        </div>
                      </div>

                      {(col.status === 'running' || col.status === 'completed') && (
                        <div className="mt-2">
                          <ProgressBar
                            value={col.progress}
                            size="sm"
                            color={
                              col.status === 'completed'
                                ? 'var(--color-primary)'
                                : undefined
                            }
                          />
                        </div>
                      )}

                      {col.error && (
                        <p className="mt-2 text-xs text-destructive">{col.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Post-migration actions */}
          {isFinished && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Post-Migration</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onValidate}
                  className="gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Validate Migration
                </Button>
                <Button
                  variant="secondary"
                  onClick={onReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Migration
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                          Collection
                        </th>
                        <th className="pb-2 px-4 text-right font-medium text-muted-foreground">
                          Source
                        </th>
                        <th className="pb-2 px-4 text-right font-medium text-muted-foreground">
                          Target
                        </th>
                        <th className="pb-2 px-4 text-center font-medium text-muted-foreground">
                          Count Match
                        </th>
                        <th className="pb-2 px-4 text-center font-medium text-muted-foreground">
                          Sample Match
                        </th>
                        <th className="pb-2 pl-4 text-center font-medium text-muted-foreground">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.map((result) => (
                        <tr
                          key={result.collectionName}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2.5 pr-4 font-medium text-foreground">
                            {result.collectionName}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                            {formatNumber(result.sourceCount)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                            {formatNumber(result.targetCount)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {result.countMatch ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="mx-auto h-4 w-4 text-destructive" />
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {result.sampleMatch ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="mx-auto h-4 w-4 text-destructive" />
                            )}
                          </td>
                          <td className="py-2.5 pl-4 text-center">
                            <Badge variant={result.passed ? 'default' : 'destructive'}>
                              {result.passed ? 'PASS' : 'FAIL'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
