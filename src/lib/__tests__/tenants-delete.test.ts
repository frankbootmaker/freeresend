/**
 * @jest-environment node
 */

import {
  assertCanDeleteTenant,
  assertCanSelfDeleteTenant,
  assertTenantNameConfirmed,
  normalizeTenantName,
  TenantError,
} from '../tenants';

describe('normalizeTenantName', () => {
  it('trims a valid name', () => {
    expect(normalizeTenantName('  Acme Mail  ')).toBe('Acme Mail');
  });

  it('rejects a blank name', () => {
    expect(() => normalizeTenantName('   ')).toThrow(TenantError);
    try {
      normalizeTenantName('');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'TENANT_NAME_REQUIRED',
        status: 400,
      });
    }
  });

  it('rejects a name over 120 characters', () => {
    expect(() => normalizeTenantName('x'.repeat(121))).toThrow(TenantError);
  });
});

describe('assertCanDeleteTenant', () => {
  it('blocks deleting the platform tenant', () => {
    expect(() => assertCanDeleteTenant('platform')).toThrow(TenantError);
    try {
      assertCanDeleteTenant('platform');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'PLATFORM_TENANT_PROTECTED',
        status: 400,
      });
    }
  });

  it('allows deleting a customer tenant slug', () => {
    expect(() => assertCanDeleteTenant('northstar')).not.toThrow();
  });
});

describe('assertCanSelfDeleteTenant', () => {
  it('allows the owner of a customer tenant', () => {
    expect(() =>
      assertCanSelfDeleteTenant({ slug: 'acme', actorRole: 'owner' }),
    ).not.toThrow();
  });

  it('allows a platform administrator', () => {
    expect(() =>
      assertCanSelfDeleteTenant({
        slug: 'acme',
        actorRole: 'member',
        isPlatformAdmin: true,
      }),
    ).not.toThrow();
  });

  it('blocks a member', () => {
    try {
      assertCanSelfDeleteTenant({ slug: 'acme', actorRole: 'member' });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'TENANT_DELETE_FORBIDDEN',
        status: 403,
      });
    }
  });

  it('blocks the platform tenant even for an owner', () => {
    expect(() =>
      assertCanSelfDeleteTenant({ slug: 'platform', actorRole: 'owner' }),
    ).toThrow(TenantError);
  });
});

describe('assertTenantNameConfirmed', () => {
  it('accepts a trimmed exact match', () => {
    expect(() =>
      assertTenantNameConfirmed('Acme Mail', '  Acme Mail  '),
    ).not.toThrow();
  });

  it('rejects a different name', () => {
    try {
      assertTenantNameConfirmed('Acme Mail', 'acme mail');
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'TENANT_NAME_MISMATCH',
        status: 400,
      });
    }
  });
});
