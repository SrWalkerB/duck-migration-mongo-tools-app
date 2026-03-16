// =====================================================
// Duck Migration - i18n Storage
// Persistência local da preferência de idioma
// =====================================================

import type { SupportedLanguage } from './i18n';

const STORAGE_KEY = 'duckMigration.language';

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadLanguage(): SupportedLanguage {
  try {
    if (isBrowserEnvironment()) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'pt-BR' || stored === 'es') {
        return stored;
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('pt')) {
        return 'pt-BR';
      }
      if (lang.startsWith('es')) {
        return 'es';
      }
      if (lang.startsWith('en')) {
        return 'en';
      }
    }
  } catch {
    // Ignora erros de ambiente ou acesso ao storage e cai no fallback
  }

  return FALLBACK_LANGUAGE;
}

export function saveLanguage(language: SupportedLanguage): void {
  try {
    if (!isBrowserEnvironment()) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Falha silenciosa - a falta de persistência não deve quebrar a UI
  }
}

