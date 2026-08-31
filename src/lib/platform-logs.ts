import { query } from '@/lib/database';

export const EMAIL_LOG_STATUSES = [
  'pending',
  'sent',
  'failed',
  'delivered',
  'bounced',
  'complained',
] as const;

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];

export type LogSearchFilters = {
  q?: string;
  tenantId?: string;
  status?: EmailLogStatus;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export type LogRetentionPolicy = {
  keepDays: number;
  stripBodyDays: number;
  lastRotateAt: string;
  lastPurged: number;
  lastStripped: number;
};

export type RotateResult = {
  purged: number;
  stripped: number;
  at: string;
};

export type PlatformLogRow = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  from_email: string;
  to_emails: unknown;
  subject: string | null;
  status: EmailLogStatus;
  message_id: string | null;
  ses_message_id: string | null;
  error_message: string | null;
  channel: string | null;
  domain_name: string | null;
  created_at: string;
  html_content?: string | null;
  text_content?: string | null;
};

const LIST_COLUMNS = `
  el.id, el.tenant_id, t.name AS tenant_name, t.slug AS tenant_slug,
  el.from_email, el.to_emails, el.subject, el.status, el.message_id,
  el.ses_message_id, el.error_message, el.channel, d.domain AS domain_name,
  el.created_at
`;

export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function parseLogFilters(
  params: URLSearchParams | Record<string, string | undefined>,
): LogSearchFilters {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key) || '';
    return params[key] || '';
  };
  const status = get('status');
  const from = get('from') || get('date_from');
  const to = get('to') || get('date_to');
  return {
    q: get('q').trim() || undefined,
    tenantId: get('tenant_id').trim() || undefined,
    status: EMAIL_LOG_STATUSES.includes(status as EmailLogStatus)
      ? (status as EmailLogStatus)
      : undefined,
    from: isIsoDate(from) ? from : undefined,
    to: isIsoDate(to) ? to : undefined,
    page: Math.max(1, clampInt(get('page') || 1, 1, 10_000, 1)),
    limit: clampInt(get('limit') || 50, 1, 100, 50),
  };
}

export function buildLogWhere(filters: LogSearchFilters): {
  clause: string;
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const add = (sql: string, value: unknown) => {
    values.push(value);
    conditions.push(sql.replace('?', `$${values.length}`));
  };

  if (filters.tenantId) add('el.tenant_id = ?', filters.tenantId);
  if (filters.status) add('el.status = ?', filters.status);
  if (filters.from) add('el.created_at >= ?::date', filters.from);
  if (filters.to) add('el.created_at < (?::date + INTERVAL \'1 day\')', filters.to);
  if (filters.q) {
    const like = `%${filters.q}%`;
    values.push(like, like, like, like, like);
    const a = values.length - 4;
    conditions.push(
      `(el.from_email ILIKE $${a}
        OR el.subject ILIKE $${a + 1}
        OR el.message_id ILIKE $${a + 2}
        OR el.ses_message_id ILIKE $${a + 3}
        OR el.to_emails::text ILIKE $${a + 4})`,
    );
  }

  return {
    clause: conditions.length ? conditions.join(' AND ') : 'TRUE',
    values,
  };
}

export function parseRetentionPatch(body: {
  keepDays?: unknown;
  stripBodyDays?: unknown;
}): { keepDays: number; stripBodyDays: number } {
  return {
    keepDays: clampInt(body.keepDays, 0, 3650, 90),
    stripBodyDays: clampInt(body.stripBodyDays, 0, 3650, 0),
  };
}

export function safeParseEmailArray(emailData: unknown): string[] {
  if (!emailData) return [];
  if (typeof emailData === 'string') {
    try {
      const parsed = JSON.parse(emailData);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(emailData)) return emailData.map(String);
  return [];
}

export function toPublicLog(row: PlatformLogRow, includeBodies = false) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    fromEmail: row.from_email,
    toEmails: safeParseEmailArray(row.to_emails),
    subject: row.subject,
    status: row.status,
    messageId: row.message_id,
    sesMessageId: row.ses_message_id,
    errorMessage: row.error_message,
    channel: row.channel,
    domain: row.domain_name,
    createdAt: row.created_at,
    ...(includeBodies
      ? { htmlContent: row.html_content, textContent: row.text_content }
      : {}),
  };
}

export async function searchPlatformLogs(filters: LogSearchFilters): Promise<{
  emails: ReturnType<typeof toPublicLog>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { clause, values } = buildLogWhere(filters);
  const offset = (filters.page - 1) * filters.limit;
  const count = await query(
    `SELECT COUNT(*)::int AS count
     FROM email_logs el
     WHERE ${clause}`,
    values,
  );
  const total = Number(count.rows[0]?.count || 0);
  const result = await query(
    `SELECT ${LIST_COLUMNS}
     FROM email_logs el
     JOIN tenants t ON t.id = el.tenant_id
     LEFT JOIN domains d ON d.id = el.domain_id
     WHERE ${clause}
     ORDER BY el.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, filters.limit, offset],
  );
  return {
    emails: (result.rows as PlatformLogRow[]).map((row) => toPublicLog(row)),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 0,
    },
  };
}

export async function getPlatformLog(id: string) {
  const result = await query(
    `SELECT ${LIST_COLUMNS}, el.html_content, el.text_content
     FROM email_logs el
     JOIN tenants t ON t.id = el.tenant_id
     LEFT JOIN domains d ON d.id = el.domain_id
     WHERE el.id = $1
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0] as PlatformLogRow | undefined;
  return row ? toPublicLog(row, true) : null;
}

export async function listTenantsForLogs(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  const result = await query(
    'SELECT id, name, slug FROM tenants ORDER BY name ASC',
  );
  return result.rows as Array<{ id: string; name: string; slug: string }>;
}

export function envRetentionDefaults(
  env: Record<string, string | undefined> = process.env,
): { keepDays: number; stripBodyDays: number } {
  return {
    keepDays: clampInt(env.LOG_RETENTION_DAYS, 0, 3650, 90),
    stripBodyDays: clampInt(env.LOG_STRIP_BODY_DAYS, 0, 3650, 0),
  };
}

export async function getLogRetention(): Promise<LogRetentionPolicy> {
  const defaults = envRetentionDefaults();
  try {
    const result = await query(
      `SELECT log_retention_days, log_strip_body_days, log_last_rotate_at,
              log_last_purged, log_last_stripped
       FROM platform_settings WHERE id = 'default' LIMIT 1`,
    );
    const row = result.rows[0] as
      | {
          log_retention_days?: number;
          log_strip_body_days?: number;
          log_last_rotate_at?: Date | string | null;
          log_last_purged?: number;
          log_last_stripped?: number;
        }
      | undefined;
    if (!row) {
      return {
        keepDays: defaults.keepDays,
        stripBodyDays: defaults.stripBodyDays,
        lastRotateAt: '',
        lastPurged: 0,
        lastStripped: 0,
      };
    }
    return {
      keepDays: clampInt(row.log_retention_days, 0, 3650, defaults.keepDays),
      stripBodyDays: clampInt(
        row.log_strip_body_days,
        0,
        3650,
        defaults.stripBodyDays,
      ),
      lastRotateAt: isoDate(row.log_last_rotate_at),
      lastPurged: Number(row.log_last_purged || 0),
      lastStripped: Number(row.log_last_stripped || 0),
    };
  } catch (error) {
    if (isMissingColumn(error)) {
      return {
        keepDays: defaults.keepDays,
        stripBodyDays: defaults.stripBodyDays,
        lastRotateAt: '',
        lastPurged: 0,
        lastStripped: 0,
      };
    }
    throw error;
  }
}

export async function updateLogRetention(patch: {
  keepDays: number;
  stripBodyDays: number;
}): Promise<LogRetentionPolicy> {
  await query(
    `UPDATE platform_settings
     SET log_retention_days = $1, log_strip_body_days = $2
     WHERE id = 'default'`,
    [patch.keepDays, patch.stripBodyDays],
  );
  return getLogRetention();
}

export async function rotatePlatformLogs(
  policy?: { keepDays: number; stripBodyDays: number },
): Promise<RotateResult> {
  const current = policy || (await getLogRetention());
  let purged = 0;
  let stripped = 0;

  if (current.keepDays > 0) {
    const result = await query(
      `DELETE FROM email_logs
       WHERE created_at < NOW() - ($1::int * INTERVAL '1 day')`,
      [current.keepDays],
    );
    purged = result.rowCount || 0;
  }

  if (current.stripBodyDays > 0) {
    const result = await query(
      `UPDATE email_logs
       SET html_content = NULL, text_content = NULL, webhook_data = NULL
       WHERE created_at < NOW() - ($1::int * INTERVAL '1 day')
         AND (
           html_content IS NOT NULL
           OR text_content IS NOT NULL
           OR webhook_data IS NOT NULL
         )`,
      [current.stripBodyDays],
    );
    stripped = result.rowCount || 0;
  }

  const at = new Date().toISOString();
  try {
    await query(
      `UPDATE platform_settings
       SET log_last_rotate_at = $1, log_last_purged = $2, log_last_stripped = $3
       WHERE id = 'default'`,
      [at, purged, stripped],
    );
  } catch (error) {
    if (!isMissingColumn(error)) throw error;
  }

  return { purged, stripped, at };
}

export async function listOpsFailures(days: number, limit = 5000) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const count = await query(
    `SELECT COUNT(*)::int AS count
     FROM email_logs
     WHERE status IN ('failed', 'bounced', 'complained')
       AND created_at >= $1`,
    [since],
  );
  const result = await query(
    `SELECT el.id, el.status, el.error_message, el.created_at,
            t.name AS tenant_name, t.slug AS tenant_slug
     FROM email_logs el
     JOIN tenants t ON t.id = el.tenant_id
     WHERE el.status IN ('failed', 'bounced', 'complained')
       AND el.created_at >= $1
     ORDER BY el.created_at DESC
     LIMIT $2`,
    [since, limit],
  );
  return {
    totalMatching: Number(count.rows[0]?.count || 0),
    events: result.rows as Array<{
      id: string;
      status: string;
      error_message: string | null;
      created_at: string;
      tenant_name: string;
      tenant_slug: string;
    }>,
  };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isoDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function isMissingColumn(error: unknown): boolean {
  const err = error as { code?: string };
  return err.code === '42703' || err.code === '42P01';
}
