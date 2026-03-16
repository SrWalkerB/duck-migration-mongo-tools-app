// =====================================================
// Duck Migration - Language Hook
// Contexto e hook para idioma da interface
// =====================================================

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SupportedLanguage, TranslationKey } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { loadLanguage, saveLanguage } from '@/lib/i18nStorage';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps): JSX.Element {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => loadLanguage());

  const setLanguage = (next: SupportedLanguage): void => {
    setLanguageState(next);
    saveLanguage(next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translate(language, key),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

