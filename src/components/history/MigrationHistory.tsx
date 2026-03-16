import { useState, useEffect } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileStack,
  Files,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMigrationHistory } from '@/services/api';
import { formatDuration, formatNumber } from '@/lib/utils';
import type { MigrationHistory as MigrationHistoryType } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/hooks/useLanguage';

const statusConfig = {
  completed: {
    labelKey: 'history.status.completed',
    icon: CheckCircle2,
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  failed: {
    labelKey: 'history.status.failed',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
  partial: {
    labelKey: 'history.status.partial',
    icon: AlertTriangle,
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
} as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MigrationHistory() {
  const [history, setHistory] = useState<MigrationHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { t } = useLanguage();

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMigrationHistory();
        setHistory(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('history.loadFailedFallback'),
        );
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">
            {t('history.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {t('history.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('history.subtitle')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <History className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium text-foreground">
            {t('history.emptyTitle')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('history.emptyDescription')}
          </p>
        </div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_32px] items-center gap-4 border-b border-border bg-card px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>{t('history.table.sourceTarget')}</span>
            <span className="w-20 text-center">
              {t('history.table.collections')}
            </span>
            <span className="w-24 text-right">
              {t('history.table.documents')}
            </span>
            <span className="w-20 text-right">
              {t('history.table.duration')}
            </span>
            <span className="w-24 text-center">
              {t('history.table.status')}
            </span>
            <span />
          </div>

          {/* Rows */}
          {history.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="border-b border-border last:border-b-0">
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className={cn(
                    'grid w-full grid-cols-[1fr_auto_auto_auto_auto_32px] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30',
                    isExpanded && 'bg-accent/20',
                  )}
                >
                  {/* Source -> Target */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">
                        {item.sourceConnection}
                      </span>
                      <span className="truncate text-muted-foreground">
                        / {item.sourceDatabase}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium text-foreground">
                        {item.targetConnection}
                      </span>
                      <span className="truncate text-muted-foreground">
                        / {item.targetDatabase}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(item.startedAt)}
                    </p>
                  </div>

                  {/* Collections count */}
                  <span className="w-20 text-center text-sm text-foreground">
                    {item.collections.length}
                  </span>

                  {/* Documents */}
                  <span className="w-24 text-right font-mono text-sm text-foreground">
                    {formatNumber(item.totalDocumentsMigrated)}
                  </span>

                  {/* Duration */}
                  <span className="w-20 text-right text-sm text-muted-foreground">
                    {formatDuration(item.durationMs)}
                  </span>

                  {/* Status badge */}
                  <div className="flex w-24 justify-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        status.className,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {t(status.labelKey)}
                    </span>
                  </div>

                  {/* Expand icon */}
                  <div className="flex justify-center text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-card/50 px-5 py-4">
                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('history.detail.started')}
                          </p>
                          <p className="text-sm text-foreground">
                            {formatDateTime(item.startedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('history.detail.completed')}
                          </p>
                          <p className="text-sm text-foreground">
                            {formatDateTime(item.completedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileStack className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('history.detail.collections')}
                          </p>
                          <p className="text-sm text-foreground">
                            {item.collections.length}{' '}
                            {t('history.detail.collectionsSuffix')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Files className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('history.detail.documents')}
                          </p>
                          <p className="text-sm text-foreground">
                            {formatNumber(item.totalDocumentsMigrated)}{' '}
                            {t('history.detail.documentsMigratedSuffix')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Collections list */}
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {t('history.detail.collectionsMigrated')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.collections.map((col) => (
                          <span
                            key={col}
                            className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-foreground"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Validation results */}
                    {item.validationResults &&
                      item.validationResults.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            {t('history.detail.validationResults')}
                          </p>
                          <div className="overflow-hidden rounded-lg border border-border">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                              <span>
                                {t('history.detail.validationCollection')}
                              </span>
                              <span className="text-right">
                                {t('history.detail.validationSource')}
                              </span>
                              <span className="text-right">
                                {t('history.detail.validationTarget')}
                              </span>
                              <span className="text-center">
                                {t('history.detail.validationMatch')}
                              </span>
                            </div>
                            {item.validationResults.map((vr) => (
                              <div
                                key={vr.collectionName}
                                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t border-border px-3 py-2 text-xs"
                              >
                                <span className="font-mono text-foreground">
                                  {vr.collectionName}
                                </span>
                                <span className="text-right text-muted-foreground">
                                  {formatNumber(vr.sourceCount)}
                                </span>
                                <span className="text-right text-muted-foreground">
                                  {formatNumber(vr.targetCount)}
                                </span>
                                <span className="text-center">
                                  {vr.passed ? (
                                    <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-green-400" />
                                  ) : (
                                    <XCircle className="mx-auto h-3.5 w-3.5 text-destructive" />
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
