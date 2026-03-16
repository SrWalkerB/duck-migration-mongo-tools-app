import { useState, useEffect } from 'react';
import { X, Plug, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { testConnectionDirect } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/hooks/useLanguage';

interface ConnectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, connectionString: string) => Promise<void>;
  initialData?: { name: string; connectionString: string };
  title?: string;
}

export function ConnectionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: ConnectionFormProps) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [connectionString, setConnectionString] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? '');
      setConnectionString(initialData?.connectionString ?? '');
      setTestResult(null);
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!connectionString.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnectionDirect(connectionString);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err instanceof Error ? err.message : t('connectionForm.testFailedFallback'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !connectionString.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim(), connectionString.trim());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('connectionForm.saveFailedFallback'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim() && connectionString.trim() && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {title
              ? title
              : initialData
                ? t('connectionForm.editTitle')
                : t('connectionForm.newTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Connection Name */}
          <div className="space-y-2">
            <label
              htmlFor="conn-name"
              className="text-sm font-medium text-foreground"
            >
              {t('connectionForm.connectionName')}
            </label>
            <input
              id="conn-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('connectionForm.connectionNamePlaceholder')}
              className={cn(
                'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'transition-colors',
              )}
            />
          </div>

          {/* Connection String */}
          <div className="space-y-2">
            <label
              htmlFor="conn-string"
              className="text-sm font-medium text-foreground"
            >
              {t('connectionForm.connectionString')}
            </label>
            <input
              id="conn-string"
              type="text"
              value={connectionString}
              onChange={(e) => {
                setConnectionString(e.target.value);
                setTestResult(null);
              }}
              placeholder={t('connectionForm.connectionStringPlaceholder')}
              className={cn(
                'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'transition-colors',
              )}
            />
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              loading={testing}
              disabled={!connectionString.trim()}
            >
              <Plug className="h-3.5 w-3.5" />
              {t('connectionForm.testConnection')}
            </Button>

            {testResult && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-sm',
                  testResult.success ? 'text-green-400' : 'text-destructive',
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {testing && !testResult && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" />
                {t('connectionForm.testing')}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              {t('connectionForm.cancel')}
            </Button>
            <Button type="submit" loading={submitting} disabled={!canSubmit}>
              {initialData
                ? t('connectionForm.saveChanges')
                : t('connectionForm.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
