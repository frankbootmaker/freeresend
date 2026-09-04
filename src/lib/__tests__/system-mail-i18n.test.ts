/**
 * @jest-environment node
 */

import { systemMailCopy } from '../system-mail-i18n';

describe('systemMailCopy', () => {
  it('keeps English subjects for the default locale', () => {
    const copy = systemMailCopy('en');
    expect(copy.configTest.subject).toMatch(/configuration test/i);
    expect(copy.passwordReset.subject).toMatch(/reset/i);
    expect(copy.waitlistWelcome.subject).toMatch(/waitlist/i);
    expect(copy.waitlistNotify.formatVolume(50000)).toBe('50,000 emails/month');
    expect(copy.byoRequestNotify.subject('Acme')).toMatch(/BYO SES request/);
  });

  it('returns German and Hungarian variants', () => {
    expect(systemMailCopy('de').configTest.subject).toMatch(/Konfigurationstest/);
    expect(systemMailCopy('de').passwordReset.cta).toMatch(/Passwort/);
    expect(systemMailCopy('hu').waitlistWelcome.title).toMatch(/várólist/);
    expect(systemMailCopy('de').waitlistNotify.formatVolume(50000))
      .toBe('50.000 E-Mails/Monat');
  });
});
