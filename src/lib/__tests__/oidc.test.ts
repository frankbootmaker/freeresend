/**
 * @jest-environment node
 */

import {
  hasAdminGroup,
  normalizeIssuer,
  oidcRedirectUri,
  parseOidcClaims,
  parseOidcGroups,
} from '../oidc';

describe('oidc helpers', () => {
  it('builds the callback URL and normalizes the issuer', () => {
    expect(oidcRedirectUri('https://mail.example.com/')).toBe(
      'https://mail.example.com/api/auth/oidc/callback',
    );
    expect(normalizeIssuer('https://auth.example.com/application/o/app')).toBe(
      'https://auth.example.com/application/o/app/',
    );
  });

  it('reads groups from Authentik claims', () => {
    expect(parseOidcGroups({ groups: ['ops', 'relayhorizon-admins'] })).toEqual([
      'ops',
      'relayhorizon-admins',
    ]);
    expect(parseOidcGroups({ ak_groups: 'relayhorizon-admins' })).toEqual([
      'relayhorizon-admins',
    ]);
    expect(hasAdminGroup(['RelayHorizon-Admins'], 'relayhorizon-admins')).toBe(true);
    expect(hasAdminGroup(['ops'], 'relayhorizon-admins')).toBe(false);
    expect(hasAdminGroup(['ops'], '')).toBe(false);
  });

  it('requires an email claim', () => {
    expect(parseOidcClaims({ email: 'Ada@Example.com', name: 'Ada' })).toEqual({
      email: 'ada@example.com',
      name: 'Ada',
      groups: [],
    });
    expect(() => parseOidcClaims({ name: 'Ada' })).toThrow(/email/i);
  });
});
