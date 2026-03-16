// =====================================================
// Duck Migration - Settings
// Tela de configurações (idioma da interface)
// =====================================================

import type { ReactElement } from 'react';
import { Select } from '@/components/ui/Select';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

export function SettingsPage(): ReactElement {
  const { language, setLanguage, t } = useLanguage();

  const options = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang,
    label: t(`settings.language.option.${lang}`),
  }));

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('settings.language.sectionTitle')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('settings.language.sectionDescription')}
          </p>
        </div>

        <div className="max-w-xs">
          <Select
            label={t('settings.language.label')}
            value={language}
            onChange={(event) => {
              const next = event.target.value;
              if (next === 'en' || next === 'pt-BR' || next === 'es') {
                setLanguage(next);
              }
            }}
            options={options}
          />
        </div>
      </section>
    </div>
  );
}

