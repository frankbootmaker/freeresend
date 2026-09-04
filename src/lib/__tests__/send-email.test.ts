/**
 * @jest-environment node
 */

jest.mock('../database', () => ({
  query: jest.fn(),
}));
jest.mock('../tenants', () => ({
  getSendWindowCounts: jest.fn(),
  getTenantById: jest.fn(),
}));
jest.mock('../domains', () => ({
  getDomainById: jest.fn(),
  getDomainByName: jest.fn(),
}));
jest.mock('../suppression', () => {
  const actual = jest.requireActual('../suppression');
  return {
    ...actual,
    findSuppressedRecipients: jest.fn(),
  };
});
jest.mock('../mail-transport', () => ({
  sendOutboundEmail: jest.fn(),
}));

import { query } from '../database';
import { getDomainByName } from '../domains';
import { sendOutboundEmail } from '../mail-transport';
import { dispatchTenantEmail, SendDispatchError } from '../send-email';
import { findSuppressedRecipients } from '../suppression';
import { getSendWindowCounts } from '../tenants';
import type { Tenant } from '../tenants';
import type { ApiKey } from '../database';

const mockedCounts = getSendWindowCounts as jest.MockedFunction<
  typeof getSendWindowCounts
>;
const mockedDomain = getDomainByName as jest.MockedFunction<typeof getDomainByName>;
const mockedSuppressed = findSuppressedRecipients as jest.MockedFunction<
  typeof findSuppressedRecipients
>;
const mockedSend = sendOutboundEmail as jest.MockedFunction<typeof sendOutboundEmail>;
const mockedQuery = query as jest.MockedFunction<typeof query>;

function tenant(partial: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    slug: 'acme',
    name: 'Acme',
    status: 'active',
    monthly_email_quota: 100,
    hourly_email_quota: 5,
    daily_email_quota: 20,
    inbound_transport: 'https',
    outbound_transport: 'ses',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...partial,
  };
}

const apiKey = {
  id: 'k1',
  tenant_id: 't1',
  domain_id: '',
  permissions: ['send'],
} as unknown as ApiKey;

const payload = {
  from: 'hello@acme.test',
  to: ['user@relay.test'],
  subject: 'Hi',
  text: 'Hi',
};

describe('dispatchTenantEmail', () => {
  beforeEach(() => {
    mockedCounts.mockReset();
    mockedDomain.mockReset();
    mockedSuppressed.mockReset();
    mockedSend.mockReset();
    mockedQuery.mockReset();
    mockedCounts.mockResolvedValue({ hour: 1, day: 2, month: 3 });
    mockedDomain.mockResolvedValue({
      id: 'd1',
      tenant_id: 't1',
      domain: 'acme.test',
      status: 'verified',
    } as never);
    mockedSuppressed.mockResolvedValue([]);
    mockedSend.mockResolvedValue('msg-1');
    mockedQuery.mockResolvedValue({ rows: [{ id: 'log-1' }] } as never);
  });

  it('rejects when an hourly cap is already used', async () => {
    mockedCounts.mockResolvedValue({ hour: 5, day: 2, month: 3 });
    await expect(
      dispatchTenantEmail({
        tenant: tenant(),
        apiKey,
        payload,
        channel: 'https',
      }),
    ).rejects.toMatchObject({
      message: 'Hourly email quota exceeded',
      status: 429,
    } satisfies Partial<SendDispatchError>);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('rejects suppressed recipients before sending', async () => {
    mockedSuppressed.mockResolvedValue(['user@relay.test']);
    await expect(
      dispatchTenantEmail({
        tenant: tenant(),
        apiKey,
        payload,
        channel: 'https',
      }),
    ).rejects.toMatchObject({
      message: 'Recipient is suppressed: user@relay.test',
      status: 422,
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('sends when caps and suppression allow it', async () => {
    const result = await dispatchTenantEmail({
      tenant: tenant(),
      apiKey,
      payload,
      channel: 'https',
    });
    expect(result.id).toBe('log-1');
    expect(mockedSend).toHaveBeenCalled();
  });
});
