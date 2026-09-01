export const LOCALES = ['en', 'de', 'hu'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'fr-locale';

export function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'de' || value === 'hu';
}

export function readBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}
