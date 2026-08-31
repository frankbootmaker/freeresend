/**
 * @jest-environment node
 */

import { verifyMcpToken, assertAgentName, McpTokenError } from '../mcp-tokens';
import { toolsForAgent } from '../mcp-server';

jest.mock('../database', () => ({
  query: jest.fn(),
}));

jest.mock('../platform-health', () => ({
  getPlatformHealth: jest.fn(),
}));

jest.mock('../platform-users', () => ({
  listPlatformAdmins: jest.fn(),
}));

jest.mock('../platform-logs', () => ({
  EMAIL_LOG_STATUSES: ['sent', 'failed', 'delivered'],
  searchPlatformLogs: jest.fn(),
}));

jest.mock('../tenants', () => ({
  getTenantById: jest.fn(),
  getTenantBySlug: jest.fn(),
  getTenantTraffic: jest.fn(),
  listTenantDomains: jest.fn(),
  listTenants: jest.fn(),
  setupCustomer: jest.fn(),
}));

import { query } from '../database';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('MCP token format', () => {
  it('rejects tokens that are not mcp_ prefixed', async () => {
    const result = await verifyMcpToken('frs_abc_secret');
    expect(result).toBeNull();
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('assertAgentName', () => {
  it('trims a valid name', () => {
    expect(assertAgentName('  Ops  ')).toBe('Ops');
  });

  it('rejects an empty name', () => {
    expect(() => assertAgentName('  ')).toThrow(McpTokenError);
  });
});

describe('toolsForAgent', () => {
  it('hides platform-only tools from tenant agents', () => {
    const tenant = toolsForAgent(false).map((tool) => tool.name);
    expect(tenant).not.toContain('list_tenants');
    expect(tenant).not.toContain('setup_customer');
    expect(tenant).toContain('get_tenant_settings');
    expect(tenant).toContain('list_email_logs');
  });

  it('gives platform agents admin and tenant tools', () => {
    const platform = toolsForAgent(true).map((tool) => tool.name);
    expect(platform).toContain('list_tenants');
    expect(platform).toContain('setup_customer');
    expect(platform).toContain('get_platform_health');
    expect(platform).toContain('get_tenant_settings');
  });
});
