import { useState, useCallback } from 'react';
import type { WizardState, CollectionMigrationConfig, ConflictStrategy } from '../types';

const TOTAL_STEPS = 6;

const initialState: WizardState = {
  step: 1,
  sourceConnectionId: '',
  sourceDatabase: '',
  targetConnectionId: '',
  targetDatabase: '',
  selectedCollections: [],
  parallelCollections: 1,
  batchSize: 1000,
  globalConflictStrategy: 'skip',
  globalFilter: '',
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step: Math.max(1, Math.min(TOTAL_STEPS, step)) }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, TOTAL_STEPS) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const setSource = useCallback((connectionId: string, database: string) => {
    setState(prev => ({
      ...prev,
      sourceConnectionId: connectionId,
      sourceDatabase: database,
    }));
  }, []);

  const setTarget = useCallback((connectionId: string, database: string) => {
    setState(prev => ({
      ...prev,
      targetConnectionId: connectionId,
      targetDatabase: database,
    }));
  }, []);

  const setSelectedCollections = useCallback((collections: CollectionMigrationConfig[]) => {
    setState(prev => ({ ...prev, selectedCollections: collections }));
  }, []);

  const setParallelCollections = useCallback((count: number) => {
    setState(prev => ({ ...prev, parallelCollections: count }));
  }, []);

  const setBatchSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, batchSize: size }));
  }, []);

  const setGlobalConflictStrategy = useCallback((strategy: ConflictStrategy) => {
    setState(prev => ({
      ...prev,
      globalConflictStrategy: strategy,
      selectedCollections: prev.selectedCollections.map(c => ({
        ...c,
        conflictStrategy: strategy,
      })),
    }));
  }, []);

  const setGlobalFilter = useCallback((filter: string) => {
    setState(prev => ({ ...prev, globalFilter: filter }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (state.step) {
      case 1: return !!state.sourceConnectionId && !!state.sourceDatabase;
      case 2: return !!state.targetConnectionId && !!state.targetDatabase;
      case 3: return state.selectedCollections.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  }, [state]);

  return {
    state,
    totalSteps: TOTAL_STEPS,
    setStep,
    nextStep,
    prevStep,
    setSource,
    setTarget,
    setSelectedCollections,
    setParallelCollections,
    setBatchSize,
    setGlobalConflictStrategy,
    setGlobalFilter,
    reset,
    canProceed,
  };
}
