import { getPlatformHealth } from '@/lib/platform-health';
import { listPlatformAdmins } from '@/lib/platform-users';
import { EMAIL_LOG_STATUSES, searchPlatformLogs } from '@/lib/platform-logs';
import type { McpAuth } from '@/lib/mcp-tokens';
import {
  getTenantById,
  getTenantBySlug,
  getTenantTraffic,
  listTenantDomains,
  listTenants,
  setupCustomer,
} from '@/lib/tenants';

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const platformTools: McpTool[] = [
  {
    name: 'list_tenants',
    description:
      'List every tenant. Platform agents only. Returns id, slug, name, status.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'setup_customer',
    description:
      'Provision a tenant and owner. Platform agents only. Secrets are returned once.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        ownerEmail: { type: 'string' },
        ownerPassword: { type: 'string' },
        domain: { type: 'string' },
        outboundTransport: { type: 'string', enum: ['ses', 'smtp'] },
        inboundTransport: { type: 'string', enum: ['https', 'smtp', 'both'] },
      },
      required: ['name', 'ownerEmail'],
    },
  },
  {
    name: 'get_platform_health',
    description:
      'Platform health: database, SES, SMTP, backups, recent volume.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_platform_admins',
    description: 'List people who can open the platform portal.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const tenantTools: McpTool[] = [
  {
    name: 'get_tenant_settings',
    description:
      'Read tenant settings: name, slug, status, quota, transports, domains. No secrets.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        slug: { type: 'string' },
      },
    },
  },
  {
    name: 'get_tenant_traffic',
    description: 'Email traffic for a tenant over a number of days.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        slug: { type: 'string' },
        days: { type: 'number' },
      },
    },
  },
  {
    name: 'list_domains',
    description: 'List sending domains for the target tenant.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        slug: { type: 'string' },
      },
    },
  },
  {
    name: 'list_email_logs',
    description:
      'Search recent email logs for the target tenant. Optional q, status, days.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        slug: { type: 'string' },
        q: { type: 'string' },
        status: { type: 'string' },
        days: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  },
];

export function toolsForAgent(isPlatform: boolean): McpTool[] {
  return isPlatform ? [...platformTools, ...tenantTools] : tenantTools;
}

export async function resolveTargetTenant(
  mcp: Pick<McpAuth, 'tenantId' | 'isPlatform'>,
  params: Record<string, unknown> = {},
) {
  const requested = (params.tenant_id as string) || undefined;
  const slug = (params.slug as string) || undefined;

  if (mcp.tenantId) {
    if (requested && requested !== mcp.tenantId) {
      throw new Error('Cannot access another tenant');
    }
    const tenant = await getTenantById(mcp.tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  if (!mcp.isPlatform) throw new Error('Unauthorized');
  if (requested) {
    const tenant = await getTenantById(requested);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }
  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }
  throw new Error('tenant_id or slug is required');
}

function textResult(value: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

export async function callMcpTool(
  mcp: McpAuth,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const allowed = new Set(toolsForAgent(mcp.isPlatform).map((tool) => tool.name));
  if (!allowed.has(name)) {
    throw new Error(
      mcp.isPlatform
        ? `Unknown tool: ${name}`
        : 'This tool is not available to a tenant agent',
    );
  }

  if (name === 'list_tenants') {
    const tenants = await listTenants();
    return textResult(
      tenants.map((tenant) => ({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        inbound_transport: tenant.inbound_transport,
        outbound_transport: tenant.outbound_transport,
      })),
    );
  }

  if (name === 'setup_customer') {
    const nameValue = String(args.name || '').trim();
    const ownerEmail = String(args.ownerEmail || '').trim();
    if (!nameValue || !ownerEmail) {
      throw new Error('name and ownerEmail are required');
    }
    const result = await setupCustomer({
      name: nameValue,
      ownerEmail,
      ownerPassword: args.ownerPassword
        ? String(args.ownerPassword)
        : undefined,
      domain: args.domain ? String(args.domain) : undefined,
      outboundTransport:
        args.outboundTransport === 'smtp' ? 'smtp' : 'ses',
      inboundTransport:
        args.inboundTransport === 'https' ||
        args.inboundTransport === 'smtp' ||
        args.inboundTransport === 'both'
          ? args.inboundTransport
          : undefined,
      createApiKey: Boolean(args.domain),
      createMcpToken: true,
    });
    return textResult({
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
      },
      owner: result.owner,
      domain: result.domain,
      apiKey: result.apiKey,
      mcpToken: result.mcpToken,
      hint: 'Store API key and MCP token now; they are not shown again.',
    });
  }

  if (name === 'get_platform_health') {
    return textResult(await getPlatformHealth());
  }

  if (name === 'list_platform_admins') {
    const users = await listPlatformAdmins();
    return textResult(users);
  }

  if (name === 'get_tenant_settings') {
    const tenant = await resolveTargetTenant(mcp, args);
    const domains = await listTenantDomains(tenant.id);
    return textResult({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      monthly_email_quota: tenant.monthly_email_quota,
      hourly_email_quota: tenant.hourly_email_quota,
      daily_email_quota: tenant.daily_email_quota,
      sending_tier: tenant.sending_tier,
      billing_mode: tenant.billing_mode,
      sending_frozen_at: tenant.sending_frozen_at || null,
      sending_frozen_reason: tenant.sending_frozen_reason || null,
      inbound_transport: tenant.inbound_transport,
      outbound_transport: tenant.outbound_transport,
      smtp_host: tenant.smtp_upstream?.host || null,
      domains,
    });
  }

  if (name === 'get_tenant_traffic') {
    const tenant = await resolveTargetTenant(mcp, args);
    const days = Number(args.days || 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return textResult({
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      traffic: await getTenantTraffic(tenant.id, since),
    });
  }

  if (name === 'list_domains') {
    const tenant = await resolveTargetTenant(mcp, args);
    return textResult(await listTenantDomains(tenant.id));
  }

  if (name === 'list_email_logs') {
    const tenant = await resolveTargetTenant(mcp, args);
    const days = Math.min(90, Math.max(1, Number(args.days || 7)));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const limit = Math.min(100, Math.max(1, Number(args.limit || 25)));
    const status = String(args.status || '');
    const logs = await searchPlatformLogs({
      q: args.q ? String(args.q) : undefined,
      tenantId: tenant.id,
      status: EMAIL_LOG_STATUSES.includes(status as never)
        ? (status as (typeof EMAIL_LOG_STATUSES)[number])
        : undefined,
      from,
      page: 1,
      limit,
    });
    return textResult({
      total: logs.pagination.total,
      events: logs.emails.map((event) => ({
        id: event.id,
        status: event.status,
        from: event.fromEmail,
        subject: event.subject,
        error: event.errorMessage,
        createdAt: event.createdAt,
      })),
    });
  }

  throw new Error(`Unknown tool: ${name}`);
}
