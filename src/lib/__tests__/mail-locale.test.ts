/**
 * @jest-environment node
 */

import { localeFromUnknown, parseLocale } from '../mail-locale';

describe('parseLocale', () => {
  it('accepts the website locales and rejects others', () => {
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('DE')).toBe('de');
    expect(parseLocale(' hu ')).toBe('hu');
    expect(parseLocale('fr')).toBeNull();
    expect(parseLocale('')).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
  });
});

describe('localeFromUnknown', () => {
  it('falls back to English', () => {
    expect(localeFromUnknown('de')).toBe('de');
    expect(localeFromUnknown('nope')).toBe('en');
    expect(localeFromUnknown('hu', 'de')).toBe('hu');
    expect(localeFromUnknown(null, 'de')).toBe('de');
  });
});
