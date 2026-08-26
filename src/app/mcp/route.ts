import { NextRequest, NextResponse } from 'next/server';
import { verifyMcpToken } from '@/lib/mcp-tokens';
import {
  getTenantById,
  getTenantBySlug,
  getTenantTraffic,
  listTenantDomains,
  listTenants,
} from '@/lib/tenants';

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  });
}

const tools = [
  {
    name: 'list_tenants',
    description:
      'List tenants (platform MCP token only). Returns id, slug, name, status.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_tenant_settings',
    description:
      'Read tenant settings: name, slug, status, quota, outbound transport, domains. No secrets.',
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
    description:
      'Email traffic for a tenant over a number of days: totals by status.',
    inputSchema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        slug: { type: 'string' },
        days: { type: 'number' },
      },
    },
  },
];

async function resolveTargetTenant(
  mcp: { tenantId: string | null; isPlatform: boolean },
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

export async function GET() {
  return NextResponse.json({
    name: 'freeresend',
    version: '1.0.0',
    protocol: 'mcp',
    transport: 'json-rpc-http',
    tools: tools.map((t) => t.name),
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing MCP token' }, { status: 401 });
  }
  const mcp = await verifyMcpToken(authHeader.substring(7));
  if (!mcp) {
    return NextResponse.json({ error: 'Invalid MCP token' }, { status: 401 });
  }

  let body: JsonRpc;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  const { id, method, params = {} } = body;

  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'freeresend', version: '1.0.0' },
        capabilities: { tools: {} },
      });
    }

    if (method === 'notifications/initialized' || method === 'initialized') {
      return new NextResponse(null, { status: 204 });
    }

    if (method === 'tools/list') {
      return rpcResult(id, { tools });
    }

    if (method === 'ping') {
      return rpcResult(id, {});
    }

    if (method === 'tools/call') {
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) || {};

      if (name === 'list_tenants') {
        if (!mcp.isPlatform) {
          return rpcError(id, -32000, 'Platform token required');
        }
        const tenants = await listTenants();
        return rpcResult(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                tenants.map((t) => ({
                  id: t.id,
                  slug: t.slug,
                  name: t.name,
                  status: t.status,
                  inbound_transport: t.inbound_transport,
                  outbound_transport: t.outbound_transport,
                })),
                null,
                2,
              ),
            },
          ],
        });
      }

      if (name === 'get_tenant_settings') {
        const tenant = await resolveTargetTenant(mcp, args);
        const domains = await listTenantDomains(tenant.id);
        return rpcResult(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: tenant.id,
                  slug: tenant.slug,
                  name: tenant.name,
                  status: tenant.status,
                  monthly_email_quota: tenant.monthly_email_quota,
                  inbound_transport: tenant.inbound_transport,
                  outbound_transport: tenant.outbound_transport,
                  smtp_host: tenant.smtp_upstream?.host || null,
                  domains,
                },
                null,
                2,
              ),
            },
          ],
        });
      }

      if (name === 'get_tenant_traffic') {
        const tenant = await resolveTargetTenant(mcp, args);
        const days = Number(args.days || 30);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const traffic = await getTenantTraffic(tenant.id, since);
        return rpcResult(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
                  traffic,
                },
                null,
                2,
              ),
            },
          ],
        });
      }

      return rpcError(id, -32601, `Unknown tool: ${name}`);
    }

    return rpcError(id, -32601, `Unknown method: ${method}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MCP error';
    return rpcError(id, -32000, message);
  }
}
