import { query } from './database';
import { saveUserLocale } from './mail-locale';
import {
  normalizeAvatar,
  normalizeDisplayName,
} from './profile-shared';
import type { Locale } from './locale';

export type UserProfile = {
  name: string;
  avatar: string | null;
};

export {
  AVATAR_MAX_CHARS,
  initialsFrom,
  normalizeAvatar,
  normalizeDisplayName,
} from './profile-shared';

export async function attachProfile<T extends { id: string; name?: string }>(
  user: T,
): Promise<T & { avatar: string | null; name?: string }> {
  const profile = await readUserProfile(user.id);
  return {
    ...user,
    name: profile?.name || user.name,
    avatar: profile?.avatar ?? null,
  };
}

export async function readUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await query(
    'SELECT name, avatar FROM users WHERE id = $1',
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    name: String(row.name || ''),
    avatar: row.avatar ? String(row.avatar) : null,
  };
}

export async function updateUserProfile(
  userId: string,
  patch: { name?: string; avatar?: string | null; locale?: Locale },
): Promise<UserProfile> {
  const current = await readUserProfile(userId);
  if (!current) {
    throw new Error('User not found');
  }
  const localeOnly =
    patch.name === undefined
    && !Object.prototype.hasOwnProperty.call(patch, 'avatar');
  if (patch.locale) {
    await saveUserLocale(userId, patch.locale);
  }
  if (localeOnly) {
    return current;
  }
  const name = normalizeDisplayName(patch.name) ?? current.name;
  const avatar = Object.prototype.hasOwnProperty.call(patch, 'avatar')
    ? normalizeAvatar(patch.avatar)
    : current.avatar;
  await query(
    'UPDATE users SET name = $2, avatar = $3 WHERE id = $1',
    [userId, name, avatar],
  );
  return { name, avatar };
}
