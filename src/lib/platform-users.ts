import { query } from './database';
import { createUser, hashPassword } from './auth';
import { addMembership, getMembership, getTenantBySlug } from './tenants';

export type PlatformAdminRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export class PlatformUserError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertCanRevokeAdmin(input: {
  actorId: string;
  targetId: string;
  adminCount: number;
}): void {
  if (input.actorId === input.targetId) {
    throw new PlatformUserError(
      'PLATFORM_USER_SELF_REVOKE',
      'You cannot revoke your own platform access',
      400,
    );
  }
  if (input.adminCount <= 1) {
    throw new PlatformUserError(
      'PLATFORM_USER_LAST_ADMIN',
      'Cannot revoke the last platform administrator',
      400,
    );
  }
}

function mapRow(row: {
  id?: string;
  email?: string;
  name?: string;
  created_at?: Date | string;
}): PlatformAdminRow {
  return {
    id: String(row.id),
    email: String(row.email || ''),
    name: String(row.name || ''),
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
  };
}

export async function listPlatformAdmins(): Promise<PlatformAdminRow[]> {
  const result = await query(
    `SELECT id, email, name, created_at
     FROM users
     WHERE is_platform_admin = TRUE
     ORDER BY created_at ASC`,
  );
  return result.rows.map(mapRow);
}

export async function listPlatformAdminsPage(input: {
  q?: string | null;
  limit: number;
  offset: number;
}): Promise<{ users: PlatformAdminRow[]; total: number }> {
  const q = input.q?.trim() ? `%${input.q.trim()}%` : null;
  const count = await query(
    `SELECT COUNT(*)::int AS count
     FROM users
     WHERE is_platform_admin = TRUE
       AND ($1::text IS NULL OR email ILIKE $1 OR name ILIKE $1)`,
    [q],
  );
  const result = await query(
    `SELECT id, email, name, created_at
     FROM users
     WHERE is_platform_admin = TRUE
       AND ($1::text IS NULL OR email ILIKE $1 OR name ILIKE $1)
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [q, input.limit, input.offset],
  );
  return {
    users: result.rows.map(mapRow),
    total: Number(count.rows[0]?.count || 0),
  };
}

async function countPlatformAdmins(): Promise<number> {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM users WHERE is_platform_admin = TRUE',
  );
  return Number(result.rows[0]?.count || 0);
}

async function findUserByEmail(email: string) {
  const result = await query(
    `SELECT id, email, name, is_platform_admin, created_at
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email],
  );
  return result.rows[0] || null;
}

async function findAdminById(id: string) {
  const result = await query(
    `SELECT id, email, name, is_platform_admin, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

async function attachPlatformTenant(userId: string): Promise<void> {
  const platform = await getTenantBySlug('platform');
  if (!platform) return;
  const existing = await getMembership(platform.id, userId);
  if (existing) return;
  await addMembership(platform.id, userId, 'owner');
}

export async function grantPlatformAdmin(input: {
  email: string;
  name?: string;
  password?: string;
}): Promise<{ user: PlatformAdminRow; created: boolean }> {
  const email = normalizeAdminEmail(input.email);
  const name = input.name?.trim() || email.split('@')[0] || email;
  const password = input.password?.trim() || '';
  const existing = await findUserByEmail(email);

  if (existing?.is_platform_admin) {
    throw new PlatformUserError(
      'PLATFORM_USER_EXISTS',
      'That person already administers the platform',
      409,
    );
  }

  if (existing) {
    await query(
      `UPDATE users
       SET is_platform_admin = TRUE, name = COALESCE(NULLIF($2, ''), name)
       WHERE id = $1`,
      [existing.id, name],
    );
    if (password.length >= 8) {
      const passwordHash = await hashPassword(password);
      await query('UPDATE users SET password_hash = $2 WHERE id = $1', [
        existing.id,
        passwordHash,
      ]);
    }
    await attachPlatformTenant(existing.id);
    const updated = await findAdminById(existing.id);
    return { user: mapRow(updated), created: false };
  }

  if (password.length < 8) {
    throw new PlatformUserError(
      'PLATFORM_USER_PASSWORD_REQUIRED',
      'A password of at least 8 characters is required for a new user',
      400,
    );
  }

  const created = await createUser(email, password, name, true);
  await attachPlatformTenant(created.id);
  return {
    user: {
      id: created.id,
      email: created.email,
      name: created.name || name,
      createdAt: new Date(created.created_at || Date.now()).toISOString(),
    },
    created: true,
  };
}

export async function updatePlatformAdmin(input: {
  id: string;
  name?: string;
  password?: string;
}): Promise<PlatformAdminRow> {
  const row = await findAdminById(input.id);
  if (!row || !row.is_platform_admin) {
    throw new PlatformUserError(
      'PLATFORM_USER_NOT_FOUND',
      'Platform administrator not found',
      404,
    );
  }

  const name = input.name?.trim();
  const password = input.password?.trim() || '';
  if (name) {
    await query('UPDATE users SET name = $2 WHERE id = $1', [input.id, name]);
  }
  if (password) {
    if (password.length < 8) {
      throw new PlatformUserError(
        'PLATFORM_USER_PASSWORD_REQUIRED',
        'A password of at least 8 characters is required',
        400,
      );
    }
    const passwordHash = await hashPassword(password);
    await query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      input.id,
      passwordHash,
    ]);
  }

  const updated = await findAdminById(input.id);
  return mapRow(updated);
}

export async function revokePlatformAdmin(input: {
  actorId: string;
  targetId: string;
}): Promise<void> {
  const row = await findAdminById(input.targetId);
  if (!row || !row.is_platform_admin) {
    throw new PlatformUserError(
      'PLATFORM_USER_NOT_FOUND',
      'Platform administrator not found',
      404,
    );
  }
  assertCanRevokeAdmin({
    actorId: input.actorId,
    targetId: input.targetId,
    adminCount: await countPlatformAdmins(),
  });
  await query(
    'UPDATE users SET is_platform_admin = FALSE WHERE id = $1',
    [input.targetId],
  );
}

export async function deletePlatformAdmin(input: {
  actorId: string;
  targetId: string;
}): Promise<void> {
  const row = await findAdminById(input.targetId);
  if (!row || !row.is_platform_admin) {
    throw new PlatformUserError(
      'PLATFORM_USER_NOT_FOUND',
      'Platform administrator not found',
      404,
    );
  }
  assertCanRevokeAdmin({
    actorId: input.actorId,
    targetId: input.targetId,
    adminCount: await countPlatformAdmins(),
  });
  await query('DELETE FROM users WHERE id = $1', [input.targetId]);
}
