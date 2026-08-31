export const AVATAR_MAX_CHARS = 120_000;
const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function normalizeAvatar(
  input: string | null | undefined,
): string | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  const trimmed = input.replace(/\s/g, '');
  if (trimmed.length > AVATAR_MAX_CHARS) {
    throw new Error('Picture is too large. Use a smaller image.');
  }
  if (!AVATAR_RE.test(trimmed)) {
    throw new Error('Picture must be a JPEG, PNG, or WebP image.');
  }
  return trimmed;
}

export function normalizeDisplayName(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;
  const name = input.trim();
  if (name.length < 1 || name.length > 80) {
    throw new Error('Name must be 1–80 characters.');
  }
  return name;
}

export function initialsFrom(name: string, email: string): string {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (letters || '?').toUpperCase().slice(0, 2);
}
