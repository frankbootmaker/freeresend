'use client';

import { LOCALES, LOCALE_LABEL, type Locale, type Theme } from '@/lib/i18n';
import { usePrefs } from '@/contexts/PrefsContext';

export default function PrefsBar() {
  const { locale, theme, setLocale, setTheme, t } = usePrefs();

  return (
    <div className="prefs">
      <div className="prefs-group" role="group" aria-label={t.prefs.language}>
        {LOCALES.map((code: Locale) => (
          <button
            key={code}
            type="button"
            className={`prefs-chip ${locale === code ? 'is-active' : ''}`}
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
          >
            {LOCALE_LABEL[code]}
          </button>
        ))}
      </div>
      <div className="prefs-group" role="group" aria-label={t.prefs.theme}>
        {(['dark', 'light'] as Theme[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`prefs-chip ${theme === mode ? 'is-active' : ''}`}
            onClick={() => setTheme(mode)}
            aria-pressed={theme === mode}
          >
            {mode === 'dark' ? t.prefs.dark : t.prefs.light}
          </button>
        ))}
      </div>
    </div>
  );
}
