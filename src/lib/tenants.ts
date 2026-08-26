import { query, transaction } from './database';
import { hashPassword, randomToken } from './auth-crypto';
import { normalizeInboundTransport, type InboundTransport } from './ingress';

export type TenantStatus = 'pending_verification' | 'active' | 'suspended';
export type OutboundTransport = 'ses' | 'smtp';
export type MembershipRole = 'owner' | 'admin' | 'member';
export type { InboundTransport };

export interface SmtpUpstream {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  billing_email?: string;
  monthly_email_quota: number;
  inbound_transport: InboundTransport;
  outbound_transport: OutboundTransport;
  ses_config?: Record<string, unknown> | null;
  smtp_upstream?: SmtpUpstream | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MembershipRole;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || `tenant-${randomToken(6).toLowerCase()}`;
}

function parseTenant(row: Record<string, unknown>): Tenant {
  let smtp = row.smtp_upstream as SmtpUpstream | null;
  if (typeof smtp === 'string') {
    try {
      smtp = JSON.parse(smtp);
    } catch {
      smtp = null;
    }
  }
  return {
    ...(row as unknown as Tenant),
    monthly_email_quota: Number(row.monthly_email_quota ?? 100000),
    inbound_transport: normalizeInboundTransport(row.inbound_transport),
    smtp_upstream: smtp,
  };
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const result = await query('SELECT * FROM tenants WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] ? parseTenant(result.rows[0]) : null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const result = await query(
    'SELECT * FROM tenants WHERE slug = $1 LIMIT 1',
    [slug],
  );
  return result.rows[0] ? parseTenant(result.rows[0]) : null;
}

export async function listTenants(): Promise<Tenant[]> {
  const result = await query(
    'SELECT * FROM tenants ORDER BY created_at DESC',
  );
  return result.rows.map(parseTenant);
}

export async function getMembershipsForUser(userId: string) {
  const result = await query(
    `SELECT tm.*, t.slug, t.name as tenant_name, t.status as tenant_status
     FROM tenant_memberships tm
     JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.user_id = $1
     ORDER BY tm.created_at ASC`,
    [userId],
  );
  return result.rows;
}

export async function getMembership(
  tenantId: string,
  userId: string,
): Promise<TenantMembership | null> {
  const result = await query(
    `SELECT * FROM tenant_memberships
     WHERE tenant_id = $1 AND user_id = $2 LIMIT 1`,
    [tenantId, userId],
  );
  return result.rows[0] || null;
}

export async function createTenant(input: {
  name: string;
  slug?: string;
  billingEmail?: string;
  quota?: number;
  inboundTransport?: InboundTransport;
  outboundTransport?: OutboundTransport;
  smtpUpstream?: SmtpUpstream | null;
  status?: TenantStatus;
}): Promise<Tenant> {
  let slug = slugify(input.slug || input.name);
  const existing = await getTenantBySlug(slug);
  if (existing) {
    slug = `${slug}-${randomToken(4).toLowerCase()}`;
  }

  const result = await query(
    `INSERT INTO tenants
      (slug, name, status, billing_email, monthly_email_quota,
       inbound_transport, outbound_transport, smtp_upstream)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      slug,
      input.name,
      input.status || 'active',
      input.billingEmail || null,
      input.quota ?? 100000,
      input.inboundTransport || 'https',
      input.outboundTransport || 'ses',
      input.smtpUpstream ? JSON.stringify(input.smtpUpstream) : null,
    ],
  );
  return parseTenant(result.rows[0]);
}

export async function addMembership(
  tenantId: string,
  userId: string,
  role: MembershipRole,
): Promise<void> {
  await query(
    `INSERT INTO tenant_memberships (tenant_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [tenantId, userId, role],
  );
}

export async function updateTenantRouting(
  tenantId: string,
  input: {
    inboundTransport?: InboundTransport;
    outboundTransport?: OutboundTransport;
    smtpUpstream?: SmtpUpstream | null;
  },
): Promise<Tenant> {
  const existing = await getTenantById(tenantId);
  if (!existing) {
    throw new Error('Tenant not found');
  }

  const inbound = input.inboundTransport || existing.inbound_transport;
  const transport = input.outboundTransport || existing.outbound_transport;
  let smtpUpstream = input.smtpUpstream === undefined
    ? existing.smtp_upstream
    : input.smtpUpstream;

  if (smtpUpstream && !String(smtpUpstream.host || '').trim()) {
    smtpUpstream = null;
  }

  if (transport === 'smtp' && smtpUpstream?.host) {
    if (!smtpUpstream.port) {
      throw new Error('SMTP upstream port is required when a host is set');
    }
    if (
      (!smtpUpstream.password || smtpUpstream.password === '********')
      && existing.smtp_upstream?.password
    ) {
      smtpUpstream = {
        ...smtpUpstream,
        password: existing.smtp_upstream.password,
      };
    }
  }

  const result = await query(
    `UPDATE tenants
     SET inbound_transport = $2,
         outbound_transport = $3,
         smtp_upstream = $4
     WHERE id = $1
     RETURNING *`,
    [
      tenantId,
      inbound,
      transport,
      transport === 'smtp' && smtpUpstream?.host
        ? JSON.stringify(smtpUpstream)
        : null,
    ],
  );

  if (!result.rows[0]) {
    throw new Error('Tenant not found');
  }
  return parseTenant(result.rows[0]);
}

export async function updateTenantTransport(
  tenantId: string,
  transport: OutboundTransport,
  smtpUpstream?: SmtpUpstream | null,
): Promise<Tenant> {
  return updateTenantRouting(tenantId, {
    outboundTransport: transport,
    smtpUpstream,
  });
}

export async function getMonthlySendCount(tenantId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM email_logs
     WHERE tenant_id = $1
       AND created_at >= date_trunc('month', NOW())
       AND status NOT IN ('failed')`,
    [tenantId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getTenantTraffic(
  tenantId: string,
  since: Date,
) {
  const result = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM email_logs
     WHERE tenant_id = $1 AND created_at >= $2
     GROUP BY status`,
    [tenantId, since],
  );
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const row of result.rows) {
    byStatus[row.status] = Number(row.count);
    total += Number(row.count);
  }
  return { total, byStatus, since: since.toISOString() };
}

export async function listTenantDomains(tenantId: string) {
  const result = await query(
    `SELECT id, domain, status, created_at
     FROM domains WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId],
  );
  return result.rows;
}

export interface CustomerSetupInput {
  name: string;
  slug?: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPassword?: string;
  quota?: number;
  inboundTransport?: InboundTransport;
  outboundTransport?: OutboundTransport;
  smtpUpstream?: SmtpUpstream | null;
  domain?: string;
  createApiKey?: boolean;
  createMcpToken?: boolean;
}

export interface CustomerSetupResult {
  tenant: Tenant;
  owner: { id: string; email: string };
  apiKey?: string;
  mcpToken?: string;
  domain?: { id: string; domain: string; status: string };
}

export async function setupCustomer(
  input: CustomerSetupInput,
): Promise<CustomerSetupResult> {
  const core = await transaction(async (client) => {
    let slug = slugify(input.slug || input.name);
    const slugCheck = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug],
    );
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${randomToken(4).toLowerCase()}`;
    }

    const tenantRes = await client.query(
      `INSERT INTO tenants
        (slug, name, status, billing_email, monthly_email_quota,
         inbound_transport, outbound_transport, smtp_upstream)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        slug,
        input.name,
        input.ownerEmail,
        input.quota ?? 100000,
        input.inboundTransport || 'https',
        input.outboundTransport || 'ses',
        input.smtpUpstream ? JSON.stringify(input.smtpUpstream) : null,
      ],
    );
    const tenant = parseTenant(tenantRes.rows[0]);

    let userRes = await client.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [input.ownerEmail],
    );
    let userId: string;
    if (userRes.rows[0]) {
      userId = userRes.rows[0].id;
    } else {
      const password = input.ownerPassword || randomToken(16);
      const passwordHash = await hashPassword(password);
      userRes = await client.query(
        `INSERT INTO users (email, password_hash, name, email_verified_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [input.ownerEmail, passwordHash, input.ownerName || input.name],
      );
      userId = userRes.rows[0].id;
    }

    await client.query(
      `INSERT INTO tenant_memberships (tenant_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (tenant_id, user_id) DO NOTHING`,
      [tenant.id, userId],
    );

    return { tenant, userId };
  });

  const result: CustomerSetupResult = {
    tenant: core.tenant,
    owner: { id: core.userId, email: input.ownerEmail },
  };

  if (input.domain) {
    const { registerTenantDomain } = await import('./domains');
    const setup = await registerTenantDomain(
      core.tenant.id,
      core.userId,
      input.domain,
    );
    result.domain = {
      id: setup.domain.id,
      domain: setup.domain.domain,
      status: setup.domain.status,
    };
  }

  if (result.domain && input.createApiKey !== false) {
    const { generateApiKey } = await import('./api-keys');
    const key = await generateApiKey(
      core.userId,
      result.domain.id,
      'default',
      ['send'],
      core.tenant.id,
    );
    result.apiKey = key.key;
  }

  if (input.createMcpToken !== false) {
    const { createMcpToken } = await import('./mcp-tokens');
    const token = await createMcpToken({
      tenantId: core.tenant.id,
      name: 'default',
    });
    result.mcpToken = token.token;
  }

  return result;
}
