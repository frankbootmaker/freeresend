/**
 * @jest-environment node
 */

jest.mock('../ses', () => ({
  sendEmail: jest.fn(),
}));
jest.mock('../platform-settings', () => ({
  getResolvedPlatformSettings: jest.fn(),
}));

import { sendEmail as sendViaSes } from '../ses';
import { getResolvedPlatformSettings } from '../platform-settings';
import { sendOutboundEmail } from '../mail-transport';
import type { Tenant } from '../tenants';

const mockedSes = sendViaSes as jest.MockedFunction<typeof sendViaSes>;
const mockedSettings = getResolvedPlatformSettings as jest.MockedFunction<
  typeof getResolvedPlatformSettings
>;

function tenant(partial: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    slug: 'acme',
    name: 'Acme',
    status: 'active',
    monthly_email_quota: 100,
    hourly_email_quota: 5,
    daily_email_quota: 20,
    sending_tier: 'probation',
    billing_mode: 'exempt',
    inbound_transport: 'https',
    outbound_transport: 'ses',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...partial,
  };
}

const payload = {
  from: 'hello@acme.test',
  to: ['user@relay.test'],
  subject: 'Hi',
  text: 'Hi',
};

describe('sendOutboundEmail pin', () => {
  beforeEach(() => {
    mockedSes.mockReset();
    mockedSettings.mockReset();
    mockedSes.mockResolvedValue('ses-1');
    mockedSettings.mockResolvedValue({
      sesAccessKeyId: 'AKIA',
      sesSecretAccessKey: 'secret',
      smtpEnabled: true,
      smtpHost: 'relay.example',
      smtpPort: 587,
      smtpSecure: false,
    } as never);
  });

  it('uses SES when the tenant is SES and the key is auto', async () => {
    await sendOutboundEmail(tenant(), payload);
    expect(mockedSes).toHaveBeenCalled();
  });

  it('pins SES even when the tenant Sending route is SMTP', async () => {
    await sendOutboundEmail(
      tenant({ outbound_transport: 'smtp' }),
      payload,
      undefined,
      'ses',
    );
    expect(mockedSes).toHaveBeenCalled();
  });

  it('rejects a SES pin when SES is not configured', async () => {
    mockedSettings.mockResolvedValue({
      sesAccessKeyId: '',
      sesSecretAccessKey: '',
      smtpEnabled: true,
      smtpHost: 'relay.example',
    } as never);
    await expect(
      sendOutboundEmail(tenant(), payload, undefined, 'ses'),
    ).rejects.toThrow(/SES egress is not configured/);
    expect(mockedSes).not.toHaveBeenCalled();
  });

  it('rejects a SMTP pin when no upstream or platform relay exists', async () => {
    mockedSettings.mockResolvedValue({
      sesAccessKeyId: 'AKIA',
      sesSecretAccessKey: 'secret',
      smtpEnabled: false,
      smtpHost: '',
    } as never);
    await expect(
      sendOutboundEmail(tenant(), payload, undefined, 'smtp'),
    ).rejects.toThrow(/SMTP egress is not configured/);
    expect(mockedSes).not.toHaveBeenCalled();
  });
});
