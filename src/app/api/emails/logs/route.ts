import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { query } from '@/lib/database';

function safeParseEmailArray(emailData: unknown): string[] {
  if (!emailData) return [];
  if (typeof emailData === 'string') {
    try {
      return JSON.parse(emailData);
    } catch {
      return [];
    }
  }
  if (Array.isArray(emailData)) {
    return emailData;
  }
  return [];
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const domainId = searchParams.get('domain_id');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const whereConditions = ['el.tenant_id = $1'];
    const queryParams: unknown[] = [session.tenant.id];

    if (session.apiKey?.domain_id) {
      whereConditions.push(`el.domain_id = $${queryParams.length + 1}`);
      queryParams.push(session.apiKey.domain_id);
    }

    if (domainId) {
      whereConditions.push(`el.domain_id = $${queryParams.length + 1}`);
      queryParams.push(domainId);
    }

    if (status) {
      whereConditions.push(`el.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) as count FROM email_logs el WHERE ${whereClause}`,
      queryParams,
    );
    const totalCount = parseInt(countResult.rows[0].count);

    const emailLogsResult = await query(
      `SELECT
        el.*,
        d.domain as domain_name,
        ak.key_name as api_key_name
      FROM email_logs el
      LEFT JOIN domains d ON el.domain_id = d.id
      LEFT JOIN api_keys ak ON el.api_key_id = ak.id
      WHERE ${whereClause}
      ORDER BY el.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset],
    );

    const emailLogs = emailLogsResult.rows.map((row) => ({
      ...row,
      to_emails: safeParseEmailArray(row.to_emails),
      cc_emails: safeParseEmailArray(row.cc_emails),
      bcc_emails: safeParseEmailArray(row.bcc_emails),
      attachments: safeParseEmailArray(row.attachments),
      domains: row.domain_name ? { domain: row.domain_name } : null,
      api_keys: row.api_key_name ? { key_name: row.api_key_name } : null,
    }));

    return json({
      success: true,
      data: {
        emails: emailLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('API Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
