'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  dictionaries,
  isLocale,
  isTheme,
  LOCALE_STORAGE_KEY,
  type Locale,
  type Messages,
  type Theme,
} from '@/lib/i18n';
import { persistLocaleToProfile } from '@/lib/persist-locale';

const THEME_KEY = 'fr-theme';

type PrefsContextType = {
  locale: Locale;
  theme: Theme;
  t: Messages;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
};

const PrefsContext = createContext<PrefsContextType | undefined>(undefined);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const nextLocale = isLocale(storedLocale) ? storedLocale : 'en';
    const nextTheme = isTheme(storedTheme) ? storedTheme : 'dark';
    setLocaleState(nextLocale);
    setThemeState(nextTheme);
    document.documentElement.lang = nextLocale;
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    persistLocaleToProfile(next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      theme,
      t: dictionaries[locale],
      setLocale,
      setTheme,
    }),
    [locale, theme, setLocale, setTheme],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) {
    throw new Error('usePrefs must be used within a PrefsProvider');
  }
  return context;
}
