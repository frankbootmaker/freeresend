import { query } from './database';

export type SuppressionReason = 'bounce' | 'complaint';

export type SesSuppressionEvent = {
  eventType?: string;
  bounce?: {
    bounceType?: string;
    bouncedRecipients?: Array<{ emailAddress?: string }>;
  };
  complaint?: {
    complainedRecipients?: Array<{ emailAddress?: string }>;
  };
};

export function extractRecipientEmail(value: string): string {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim().toLowerCase();
}

export function collectRecipientEmails(payload: {
  to?: string[];
  cc?: string[];
  bcc?: string[];
}): string[] {
  const seen = new Set<string>();
  for (const raw of [...(payload.to || []), ...(payload.cc || []), ...(payload.bcc || [])]) {
    const email = extractRecipientEmail(String(raw || ''));
    if (email.includes('@')) {
      seen.add(email);
    }
  }
  return [...seen];
}

export function shouldSuppressBounce(bounceType?: string): boolean {
  return bounceType === 'Permanent';
}

export function suppressionActionsFromSesEvent(
  message: SesSuppressionEvent,
): Array<{ email: string; reason: SuppressionReason; bounceType?: string }> {
  const actions: Array<{
    email: string;
    reason: SuppressionReason;
    bounceType?: string;
  }> = [];

  if (message.eventType === 'bounce' && shouldSuppressBounce(message.bounce?.bounceType)) {
    for (const row of message.bounce?.bouncedRecipients || []) {
      const email = extractRecipientEmail(String(row.emailAddress || ''));
      if (email.includes('@')) {
        actions.push({
          email,
          reason: 'bounce',
          bounceType: message.bounce?.bounceType,
        });
      }
    }
  }

  if (message.eventType === 'complaint') {
    for (const row of message.complaint?.complainedRecipients || []) {
      const email = extractRecipientEmail(String(row.emailAddress || ''));
      if (email.includes('@')) {
        actions.push({ email, reason: 'complaint' });
      }
    }
  }

  return actions;
}

export async function findSuppressedRecipients(
  tenantId: string,
  emails: string[],
): Promise<string[]> {
  if (emails.length === 0) return [];
  const result = await query(
    `SELECT email
     FROM suppressed_recipients
     WHERE tenant_id = $1 AND email = ANY($2::text[])`,
    [tenantId, emails],
  );
  return result.rows.map((row) => String(row.email));
}

export async function recordSesSuppressions(input: {
  tenantId: string;
  emailLogId?: string | null;
  event: SesSuppressionEvent;
}): Promise<number> {
  const actions = suppressionActionsFromSesEvent(input.event);
  if (actions.length === 0) return 0;

  let inserted = 0;
  for (const action of actions) {
    const result = await query(
      `INSERT INTO suppressed_recipients (
         tenant_id, email, reason, bounce_type, email_log_id
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [
        input.tenantId,
        action.email,
        action.reason,
        action.bounceType || null,
        input.emailLogId || null,
      ],
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}
