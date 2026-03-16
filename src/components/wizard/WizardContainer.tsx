import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from '@/hooks/useWizard';
import { useMigration } from '@/hooks/useMigration';
import { Button } from '@/components/ui/Button';
import { StepSelectSource } from './StepSelectSource';
import { StepSelectTarget } from './StepSelectTarget';
import { StepSelectCollections } from './StepSelectCollections';
import { StepConfigure } from './StepConfigure';
import { StepReview } from './StepReview';
import { StepExecute } from './StepExecute';
import type { MigrationRequest } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

const STEP_LABEL_KEYS = [
  'wizard.step.source',
  'wizard.step.target',
  'wizard.step.collections',
  'wizard.step.configure',
  'wizard.step.review',
  'wizard.step.execute',
] as const;

export function WizardContainer() {
  const wizard = useWizard();
  const migration = useMigration();
  const { t } = useLanguage();

  const {
    state,
    nextStep,
    prevStep,
    setSource,
    setTarget,
    setSelectedCollections,
    setParallelCollections,
    setBatchSize,
    setGlobalConflictStrategy,
    setGlobalFilter,
    canProceed,
    reset,
  } = wizard;

  const handleStartMigration = async () => {
    const request: MigrationRequest = {
      sourceConnectionId: state.sourceConnectionId,
      sourceDatabase: state.sourceDatabase,
      targetConnectionId: state.targetConnectionId,
      targetDatabase: state.targetDatabase,
      collections: state.selectedCollections.map((c) => ({
        ...c,
        ...(state.globalFilter.trim()
          ? { filter: JSON.parse(state.globalFilter) }
          : {}),
      })),
      parallelCollections: state.parallelCollections,
      batchSize: state.batchSize,
    };
    await migration.startMigration(request);
  };

  const handleValidate = async () => {
    await migration.runValidation({
      sourceConnectionId: state.sourceConnectionId,
      sourceDatabase: state.sourceDatabase,
      targetConnectionId: state.targetConnectionId,
      targetDatabase: state.targetDatabase,
      collections: state.selectedCollections.map((c) => ({
        name: c.name,
        ...(c.filter ? { filter: c.filter } : {}),
        conflictStrategy: c.conflictStrategy,
      })),
    });
  };

  const handleReset = () => {
    reset();
  };

  const isLastStep = state.step === 6;
  const isFirstStep = state.step === 1;

  const renderStep = () => {
    const commonProps = { state, onNext: nextStep, onPrev: prevStep };

    switch (state.step) {
      case 1:
        return <StepSelectSource {...commonProps} setSource={setSource} />;
      case 2:
        return <StepSelectTarget {...commonProps} setTarget={setTarget} />;
      case 3:
        return (
          <StepSelectCollections
            {...commonProps}
            setSelectedCollections={setSelectedCollections}
          />
        );
      case 4:
        return (
          <StepConfigure
            {...commonProps}
            setParallelCollections={setParallelCollections}
            setBatchSize={setBatchSize}
            setGlobalConflictStrategy={setGlobalConflictStrategy}
            setGlobalFilter={setGlobalFilter}
          />
        );
      case 5:
        return <StepReview {...commonProps} />;
      case 6:
        return (
          <StepExecute
            {...commonProps}
            progress={migration.progress}
            isRunning={migration.isRunning}
            error={migration.error}
            validationResults={migration.validationResults}
            onStartMigration={handleStartMigration}
            onCancel={migration.cancelMigration}
            onValidate={handleValidate}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      {/* Step Indicator */}
      <nav aria-label="Migration wizard progress" className="px-2 pb-2">
        <ol className="flex items-center gap-2">
          {STEP_LABEL_KEYS.map((labelKey, index) => {
            const stepNum = index + 1;
            const isCurrent = state.step === stepNum;
            const isComplete = state.step > stepNum;

            return (
              <li
                key={labelKey}
                className={cn(
                  'flex items-center min-w-0',
                  index < STEP_LABEL_KEYS.length - 1 && 'flex-1',
                )}
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {/* Circle */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isComplete
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-secondary text-muted-foreground',
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent
                        ? 'text-primary'
                        : isComplete
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEP_LABEL_KEYS.length - 1 && (
                  <div
                    className={cn(
                      'mx-3 mb-5 h-0.5 flex-1 min-w-4 transition-colors',
                      isComplete ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      {!isLastStep && (
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('wizard.nav.back')}
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-1.5"
          >
            {t('wizard.nav.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
