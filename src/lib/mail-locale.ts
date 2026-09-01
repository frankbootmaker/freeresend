import { query } from './database';
import { isLocale, type Locale } from './locale';

let localeColumnReady = false;

async function ensureLocaleColumn(): Promise<void> {
  if (localeColumnReady) return;
  try {
    await query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(8)',
    );
    localeColumnReady = true;
  } catch (error) {
    console.warn('Could not ensure users.locale column:', error);
  }
}

export function parseLocale(value: unknown): Locale | null {
  if (typeof value !== 'string') return null;
  const next = value.trim().toLowerCase();
  return isLocale(next) ? next : null;
}

export function localeFromUnknown(
  value: unknown,
  fallback: Locale = 'en',
): Locale {
  return parseLocale(value) || fallback;
}

export async function localeForUserId(userId: string): Promise<Locale | null> {
  await ensureLocaleColumn();
  try {
    const result = await query(
      'SELECT locale FROM users WHERE id = $1 LIMIT 1',
      [userId],
    );
    return parseLocale(result.rows[0]?.locale);
  } catch {
    return null;
  }
}

export async function localeForEmail(email: string): Promise<Locale | null> {
  await ensureLocaleColumn();
  try {
    const result = await query(
      'SELECT locale FROM users WHERE lower(email) = $1 LIMIT 1',
      [email.trim().toLowerCase()],
    );
    return parseLocale(result.rows[0]?.locale);
  } catch {
    return null;
  }
}

export async function saveUserLocale(
  userId: string,
  locale: Locale,
): Promise<void> {
  await ensureLocaleColumn();
  await query('UPDATE users SET locale = $2 WHERE id = $1', [userId, locale]);
}

export async function saveUserLocaleByEmail(
  email: string,
  locale: Locale,
): Promise<void> {
  await ensureLocaleColumn();
  await query(
    'UPDATE users SET locale = $2 WHERE lower(email) = $1',
    [email.trim().toLowerCase(), locale],
  );
}

export async function resolveMailLocale(input: {
  userId?: string | null;
  email?: string | null;
  requested?: unknown;
}): Promise<Locale> {
  const requested = parseLocale(input.requested);
  if (requested && input.userId) {
    try {
      await saveUserLocale(input.userId, requested);
    } catch (error) {
      console.warn('Could not store user locale:', error);
    }
    return requested;
  }
  if (requested && input.email) {
    try {
      await saveUserLocaleByEmail(input.email, requested);
    } catch {
      // Recipient may not have an account yet.
    }
    return requested;
  }
  if (requested) return requested;
  if (input.userId) {
    const stored = await localeForUserId(input.userId);
    if (stored) return stored;
  }
  if (input.email) {
    const stored = await localeForEmail(input.email);
    if (stored) return stored;
  }
  return 'en';
}
