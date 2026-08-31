/**
 * @jest-environment node
 */

import {
  acmeDnsRecordName,
  computeRenewAt,
  findLongestZone,
  isPublicTlsHostname,
  parseTlsHostname,
  parseTlsSource,
  shouldIssueLetsEncrypt,
} from '../smtp-tls';

describe('parseTlsHostname', () => {
  it('normalizes URLs and rejects junk', () => {
    expect(parseTlsHostname('https://SMTP.Example.com:587/path')).toBe(
      'smtp.example.com',
    );
    expect(parseTlsHostname('not a host')).toBe('');
    expect(parseTlsHostname('user@host')).toBe('');
  });
});

describe('isPublicTlsHostname', () => {
  it('rejects localhost and bare names', () => {
    expect(isPublicTlsHostname('localhost')).toBe(false);
    expect(isPublicTlsHostname('127.0.0.1')).toBe(false);
    expect(isPublicTlsHostname('smtp')).toBe(false);
    expect(isPublicTlsHostname('smtp.example.com')).toBe(true);
  });
});

describe('parseTlsSource', () => {
  it('defaults to Let’s Encrypt', () => {
    expect(parseTlsSource(undefined)).toBe('letsencrypt');
    expect(parseTlsSource('manual')).toBe('manual');
  });
});

describe('computeRenewAt', () => {
  it('schedules renewal 30 days before expiry', () => {
    const expires = new Date('2026-11-30T00:00:00.000Z');
    const now = new Date('2026-08-31T00:00:00.000Z');
    expect(computeRenewAt(expires, now).toISOString()).toBe(
      '2026-10-31T00:00:00.000Z',
    );
  });
});

describe('findLongestZone', () => {
  it('picks the most specific DigitalOcean zone', () => {
    expect(
      findLongestZone('smtp.mail.example.com', ['example.com', 'mail.example.com']),
    ).toBe('mail.example.com');
    expect(acmeDnsRecordName('smtp.example.com', 'example.com')).toBe(
      '_acme-challenge.smtp.example.com',
    );
  });
});

describe('shouldIssueLetsEncrypt', () => {
  const base = {
    source: 'letsencrypt' as const,
    domain: 'smtp.example.com',
    status: 'idle' as const,
    now: new Date('2026-08-31T00:00:00.000Z'),
  };

  it('issues when there is no certificate yet', () => {
    expect(shouldIssueLetsEncrypt(base)).toBe(true);
  });

  it('waits while a request is in flight', () => {
    expect(
      shouldIssueLetsEncrypt({
        ...base,
        status: 'pending',
        statusAt: '2026-08-31T00:00:00.000Z',
        certPem: 'CERT',
      }),
    ).toBe(false);
  });

  it('renews when the scheduled time has passed', () => {
    expect(
      shouldIssueLetsEncrypt({
        ...base,
        certPem: 'CERT',
        renewAt: '2026-08-01T00:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('does not issue for manual PEMs or localhost', () => {
    expect(
      shouldIssueLetsEncrypt({ ...base, source: 'manual' }),
    ).toBe(false);
    expect(
      shouldIssueLetsEncrypt({ ...base, domain: 'localhost' }),
    ).toBe(false);
  });
});
