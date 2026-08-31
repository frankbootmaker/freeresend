/**
 * @jest-environment node
 */

import { initialsFrom, normalizeAvatar, normalizeDisplayName } from '../profile';

describe('normalizeAvatar', () => {
  it('accepts a small jpeg data URL and rejects other payloads', () => {
    expect(normalizeAvatar(null)).toBeNull();
    expect(normalizeAvatar('')).toBeNull();
    expect(
      normalizeAvatar('data:image/jpeg;base64,abc+/= '),
    ).toBe('data:image/jpeg;base64,abc+/=');
    expect(() => normalizeAvatar('https://example.com/a.png')).toThrow(/jpeg/i);
    expect(() => normalizeAvatar(`data:image/jpeg;base64,${'a'.repeat(120_001)}`))
      .toThrow(/too large/i);
  });
});

describe('normalizeDisplayName', () => {
  it('trims and rejects empty or long names', () => {
    expect(normalizeDisplayName(' Ada ')).toBe('Ada');
    expect(normalizeDisplayName(undefined)).toBeUndefined();
    expect(() => normalizeDisplayName('')).toThrow(/1–80/);
    expect(() => normalizeDisplayName('x'.repeat(81))).toThrow(/1–80/);
  });
});

describe('initialsFrom', () => {
  it('uses name parts then email', () => {
    expect(initialsFrom('Ada Lovelace', 'a@b.test')).toBe('AL');
    expect(initialsFrom('', 'ops@nethorizon.test')).toBe('ON');
  });
});
