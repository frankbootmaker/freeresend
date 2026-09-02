/**
 * @jest-environment node
 */

import {
  assertCanDeleteTenant,
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
