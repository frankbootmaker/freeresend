'use client';

import { LOCALE_LABEL, LOCALES, type Locale } from '@/lib/i18n';
import { usePrefs } from '@/contexts/PrefsContext';

export default function OpsPrefs() {
  const { locale, theme, setLocale, setTheme, t } = usePrefs();

  const cycleLocale = () => {
    const index = LOCALES.indexOf(locale);
    const next = LOCALES[(index + 1) % LOCALES.length] as Locale;
    setLocale(next);
  };

  return (
    <>
      <button
        type="button"
        className="language-cycle"
        aria-label={t.prefs.changeLanguage}
        onClick={cycleLocale}
      >
        {LOCALE_LABEL[locale]}
      </button>
      <button
        type="button"
        className="theme"
        aria-label={t.prefs.toggleTheme}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? t.prefs.light.toUpperCase() : t.prefs.dark.toUpperCase()}
      </button>
    </>
  );
}
