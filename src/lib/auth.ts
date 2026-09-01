import jwt from 'jsonwebtoken';
import { query } from './database';
import type { User } from './database';
import { hashPassword, verifyPassword } from './auth-crypto';
import {
  addMembership,
  createTenant,
  getMembershipsForUser,
  getTenantBySlug,
} from './tenants';
import type { MembershipRole } from './tenants';
import { createMcpToken } from './mcp-tokens';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isPlatformAdmin: boolean;
  tenantId: string;
  membershipRole: MembershipRole;
}

export { hashPassword, verifyPassword };

function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: user.isPlatformAdmin,
      tenantId: user.tenantId,
      membershipRole: user.membershipRole,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function verifyJWT(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (!decoded.id || !decoded.tenantId) return null;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isPlatformAdmin: Boolean(decoded.isPlatformAdmin),
      tenantId: decoded.tenantId,
      membershipRole: decoded.membershipRole || 'member',
    };
  } catch {
    return null;
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string,
  isPlatformAdmin = false,
): Promise<User> {
  const passwordHash = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (email, password_hash, name, is_platform_admin)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [normalizeLoginEmail(email), passwordHash, name, isPlatformAdmin],
  );
  if (result.rows.length === 0) {
    throw new Error('Failed to create user');
  }
  return result.rows[0];
}

export async function buildAuthUser(
  userId: string,
  tenantId?: string,
): Promise<AuthUser | null> {
  const userRes = await query(
    'SELECT id, email, name, is_platform_admin FROM users WHERE id = $1',
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) return null;

  const memberships = await getMembershipsForUser(user.id);
  const match = tenantId
    ? memberships.find((m) => m.tenant_id === tenantId)
    : undefined;

  if (match) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: Boolean(user.is_platform_admin),
      tenantId: match.tenant_id,
      membershipRole: match.role,
    };
  }

  if (user.is_platform_admin && tenantId) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: true,
      tenantId,
      membershipRole: 'owner',
    };
  }

  const fallback = memberships[0];
  if (!fallback) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isPlatformAdmin: Boolean(user.is_platform_admin),
    tenantId: fallback.tenant_id,
    membershipRole: fallback.role,
  };
}

export async function authenticateUser(
  email: string,
  password: string,
  tenantId?: string,
): Promise<AuthUser | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE lower(email) = $1 LIMIT 1',
      [normalizeLoginEmail(email)],
    );
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) return null;
    return buildAuthUser(user.id, tenantId);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  return buildAuthUser(id);
}

export async function readPlatformAdminFlag(
  userId: string,
): Promise<boolean | null> {
  const result = await query(
    'SELECT is_platform_admin FROM users WHERE id = $1',
    [userId],
  );
  if (result.rows.length === 0) return null;
  return Boolean(result.rows[0].is_platform_admin);
}

export async function initializeDefaultUser(): Promise<{
  created: boolean;
  skipped?: boolean;
  mcpToken?: string;
}> {
  const adminEmail = process.env.ADMIN_EMAIL
    ? normalizeLoginEmail(process.env.ADMIN_EMAIL)
    : '';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      'ADMIN_EMAIL and ADMIN_PASSWORD not set. Skipping default user creation.',
    );
    return { created: false, skipped: true };
  }

  const existing = await query(
    'SELECT id FROM users WHERE lower(email) = $1 LIMIT 1',
    [adminEmail],
  );
  let created = false;
  let adminId = existing.rows[0]?.id as string | undefined;
  if (!adminId) {
    const user = await createUser(adminEmail, adminPassword, 'Admin', true);
    adminId = user.id;
    created = true;
    console.log('Default platform admin created');
  } else {
    const passwordHash = await hashPassword(adminPassword);
    await query(
      `UPDATE users
       SET password_hash = $1, email = $2, is_platform_admin = true
       WHERE id = $3`,
      [passwordHash, adminEmail, adminId],
    );
    console.log('Default platform admin password synced from environment');
  }

  let tenant = await getTenantBySlug('platform');
  if (!tenant) {
    tenant = await createTenant({
      name: 'Platform',
      slug: 'platform',
      billingEmail: adminEmail,
    });
  }
  await addMembership(tenant.id, adminId, 'owner');

  const existingMcp = await query(
    'SELECT id FROM mcp_tokens WHERE tenant_id IS NULL LIMIT 1',
  );
  if (existingMcp.rows.length > 0) {
    return { created };
  }

  const mcp = await createMcpToken({
    tenantId: null,
    name: 'platform',
    createdBy: adminId,
  });
  return { created, mcpToken: mcp.token };
}
