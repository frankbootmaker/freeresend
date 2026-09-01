'use client';

import { api } from './api';
import { isLocale, LOCALE_STORAGE_KEY, type Locale } from './locale';

export function persistLocaleToProfile(locale: Locale): void {
  if (typeof window === 'undefined') return;
  if (!window.localStorage.getItem('auth_token')) return;
  void api.updateProfile({ locale }).catch(() => {});
}

export function persistStoredLocaleToProfile(): void {
  if (typeof window === 'undefined') return;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) persistLocaleToProfile(stored);
}