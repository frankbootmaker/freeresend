export type SesEventKind =
  | 'send'
  | 'delivery'
  | 'bounce'
  | 'complaint'
  | 'reject';

export type SesEventPayload = {
  eventType?: string;
  notificationType?: string;
  mail?: { messageId?: string };
  bounce?: {
    bounceType?: string;
    bouncedRecipients?: Array<{
      emailAddress?: string;
      diagnosticCode?: string;
    }>;
  };
  complaint?: {
    complainedRecipients?: Array<{ emailAddress?: string }>;
  };
  [key: string]: unknown;
};

export type ParsedSesWebhook =
  | { kind: 'subscription'; subscribeUrl: string }
  | { kind: 'event'; eventType: SesEventKind; messageId: string | null; payload: SesEventPayload }
  | { kind: 'ignored' };

const EVENT_ALIASES: Record<string, SesEventKind> = {
  send: 'send',
  delivery: 'delivery',
  bounce: 'bounce',
  complaint: 'complaint',
  reject: 'reject',
};

export function normalizeSesEventType(raw?: string | null): SesEventKind | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return EVENT_ALIASES[key] || null;
}

export function sesEventKindFromPayload(payload: {
  eventType?: string;
  notificationType?: string;
}): SesEventKind | null {
  return (
    normalizeSesEventType(payload.eventType)
    || normalizeSesEventType(payload.notificationType)
  );
}

export function normalizeSesMessageId(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/^<|>$/g, '');
  return trimmed || null;
}

export function messageIdLookupValues(raw?: string | null): string[] {
  const id = normalizeSesMessageId(raw);
  if (!id) return [];
  return [...new Set([id, `<${id}>`, raw ? String(raw).trim() : ''])].filter(Boolean);
}

export function isAllowedSnsSubscribeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:'
      && /^sns\.[a-z0-9-]+\.amazonaws\.com$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

function parseEventPayload(value: unknown): ParsedSesWebhook {
  const payload = asRecord(value);
  if (!payload) return { kind: 'ignored' };
  const eventType = sesEventKindFromPayload(payload);
  if (!eventType) return { kind: 'ignored' };
  const mail = asRecord(payload.mail);
  return {
    kind: 'event',
    eventType,
    messageId: normalizeSesMessageId(
      typeof mail?.messageId === 'string' ? mail.messageId : null,
    ),
    payload: payload as SesEventPayload,
  };
}

export function parseSesWebhookBody(body: unknown): ParsedSesWebhook {
  const rec = asRecord(body);
  if (!rec) return { kind: 'ignored' };

  if (rec.Type === 'SubscriptionConfirmation') {
    const url = typeof rec.SubscribeURL === 'string' ? rec.SubscribeURL : '';
    if (!isAllowedSnsSubscribeUrl(url)) return { kind: 'ignored' };
    return { kind: 'subscription', subscribeUrl: url };
  }

  if (rec.Type === 'Notification') {
    const inner = typeof rec.Message === 'string'
      ? parseJsonObject(rec.Message)
      : rec.Message;
    return parseEventPayload(inner);
  }

  return parseEventPayload(rec);
}

export async function confirmSnsSubscription(url: string): Promise<boolean> {
  if (!isAllowedSnsSubscribeUrl(url)) return false;
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok;
}
