/**
 * @jest-environment node
 */

import {
  parseTenantSesConfig,
  tenantAllowsByoSes,
  tenantSesMode,
  tenantSesSendAccount,
  withSesByoAllowed,
} from '../tenant-ses';
import type { Tenant } from '../tenants';

function tenant(partial: Partial<Tenant>): Tenant {
  return {
    id: 't1',
    slug: 'acme',
    name: 'Acme',
    status: 'active',
    monthly_email_quota: 1000,
    inbound_transport: 'https',
    outbound_transport: 'ses',
    ...partial,
  };
}

describe('tenant SES helpers', () => {
  it('treats missing membership as platform-only', () => {
    const row = tenant({});
    expect(tenantAllowsByoSes(row)).toBe(false);
    expect(tenantSesMode(row)).toBe('platform');
  });

  it('keeps BYO mode only when membership allows it', () => {
    const row = tenant({
      metadata: { ses_byo_allowed: true },
      ses_config: { mode: 'byo', accessKeyId: 'AKIA', secretAccessKey: 's' },
    });
    expect(tenantSesMode(row)).toBe('byo');
    expect(tenantSesSendAccount(row)?.accessKeyId).toBe('AKIA');
  });

  it('falls back to platform if membership is revoked', () => {
    const row = tenant({
      metadata: { ses_byo_allowed: false },
      ses_config: { mode: 'byo', accessKeyId: 'AKIA', secretAccessKey: 's' },
    });
    expect(tenantSesMode(row)).toBe('platform');
    expect(tenantSesSendAccount(row)).toBeUndefined();
  });

  it('parses stored JSON and writes the membership flag', () => {
    expect(parseTenantSesConfig('{"mode":"byo","region":"eu-west-1"}')).toEqual({
      mode: 'byo',
      region: 'eu-west-1',
      configurationSet: undefined,
      accessKeyId: undefined,
      secretAccessKey: undefined,
    });
    expect(withSesByoAllowed({ note: 'x' }, true)).toEqual({
      note: 'x',
      ses_byo_allowed: true,
    });
  });
});
