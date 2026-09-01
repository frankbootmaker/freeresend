import {
  assertEmailOnDomain,
  hostnameFromPublicUrl,
  localPartFromEmail,
  normalizeLocalPart,
  platformFromOnDomain,
  suggestedSystemDomain,
} from '../system-domain-name';

describe('hostnameFromPublicUrl', () => {
  it('reads the host from an origin URL', () => {
    expect(hostnameFromPublicUrl('https://relay-dev.in3.technology')).toBe(
      'relay-dev.in3.technology',
    );
    expect(hostnameFromPublicUrl('https://relay-dev.in3.technology/portal')).toBe(
      'relay-dev.in3.technology',
    );
  });

  it('rejects junk', () => {
    expect(hostnameFromPublicUrl('')).toBe('');
    expect(hostnameFromPublicUrl('not a url')).toBe('');
  });
});

describe('suggestedSystemDomain', () => {
  it('prefers NEXTAUTH_URL over the request origin', () => {
    expect(
      suggestedSystemDomain({
        nextAuthUrl: 'https://relay-dev.in3.technology',
        requestOrigin: 'https://other.example',
      }),
    ).toEqual({
      domain: 'relay-dev.in3.technology',
      source: 'nextauth',
      isPublic: true,
    });
  });

  it('falls back to the request origin', () => {
    expect(
      suggestedSystemDomain({
        nextAuthUrl: '',
        requestOrigin: 'https://relay-dev.in3.technology',
      }),
    ).toEqual({
      domain: 'relay-dev.in3.technology',
      source: 'origin',
      isPublic: true,
    });
  });

  it('marks localhost as not public', () => {
    expect(
      suggestedSystemDomain({ nextAuthUrl: 'http://localhost:3001' }),
    ).toEqual({
      domain: 'localhost',
      source: 'nextauth',
      isPublic: false,
    });
  });
});

describe('platform From helpers', () => {
  it('builds noreply@domain by default', () => {
    expect(platformFromOnDomain('', 'relay-dev.in3.technology')).toBe(
      'noreply@relay-dev.in3.technology',
    );
    expect(platformFromOnDomain('Mailer', 'Example.com')).toBe(
      'mailer@Example.com',
    );
  });

  it('reads the local part from an address', () => {
    expect(localPartFromEmail('Ops@Relay.test')).toBe('ops');
    expect(normalizeLocalPart('mailer@ignored.test')).toBe('mailer');
  });

  it('rejects a From on another domain', () => {
    expect(() => assertEmailOnDomain('a@other.test', 'relay.test')).toThrow(
      /system domain/,
    );
    expect(() => assertEmailOnDomain('a@relay.test', 'relay.test')).not.toThrow();
  });
});
