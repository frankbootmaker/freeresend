import { dictionaries } from '../i18n';

describe('i18n dictionaries', () => {
  it('covers en, de, and hu landing headlines', () => {
    expect(dictionaries.en.brand).toBe('RelayHorizon');
    expect(dictionaries.de.brand).toBe('RelayHorizon');
    expect(dictionaries.hu.brand).toBe('RelayHorizon');
    expect(dictionaries.en.brandBy).toMatch(/Nethorizon/);
    expect(dictionaries.en.landing.headline1).toMatch(/outbound email/i);
    expect(dictionaries.de.landing.headline1).toMatch(/ausgehende/i);
    expect(dictionaries.hu.landing.headline1).toMatch(/kimenő/i);
    expect(dictionaries.en.landing.fact4Title).toMatch(/egress/i);
    expect(dictionaries.de.landing.fact4Title).toMatch(/egress/i);
    expect(dictionaries.hu.landing.fact4Title).toMatch(/kimenet/i);
    expect(dictionaries.de.keys.create).toMatch(/schlüssel/i);
    expect(dictionaries.hu.logs.title).toMatch(/esemény/i);
    expect(dictionaries.en.changelog.title).toMatch(/release/i);
    expect(dictionaries.de.changelog.close).toMatch(/schließen/i);
    expect(dictionaries.hu.changelog.current).toMatch(/telepítés/i);
    expect(dictionaries.en.nav.guide).toBe('Guide');
    expect(dictionaries.de.nav.guide).toMatch(/handbuch/i);
    expect(dictionaries.hu.nav.guide).toMatch(/útmutató/i);
  });
});
