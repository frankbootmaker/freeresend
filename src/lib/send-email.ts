import { query } from './database';
import { sendOutboundEmail } from './mail-transport';
import { getDomainById, getDomainByName } from './domains';
import { getSendWindowCounts, getTenantById, type Tenant } from './tenants';
import { ingressAllows, ingressBlockedMessage, type IngressChannel } from './ingress';
import { capsFromTenant, quotaRejection } from './sending-quota';
import {
  collectRecipientEmails,
  findSuppressedRecipients,
} from './suppression';
import type { ApiKey } from './database';
import type { SendEmailOptions } from './ses';

export class SendDispatchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface DispatchEmailInput {
  tenant: Tenant;
  apiKey: ApiKey;
  payload: SendEmailOptions;
  channel: IngressChannel;
}

function extractEmail(value: string): string {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim();
}

function domainOf(from: string): string {
  return extractEmail(from).split('@')[1] || '';
}

export async function dispatchTenantEmail(input: DispatchEmailInput) {
  const { tenant, apiKey, payload, channel } = input;

  if (!ingressAllows(tenant, channel)) {
    throw new SendDispatchError(ingressBlockedMessage(channel), 403);
  }
  if (!apiKey.permissions.includes('send')) {
    throw new SendDispatchError('API key does not have send permission', 403);
  }
  if (tenant.status !== 'active') {
    throw new SendDispatchError('Tenant is not active', 403);
  }
  if (tenant.sending_frozen_at) {
    throw new SendDispatchError('Sending is frozen', 423);
  }

  const used = await getSendWindowCounts(tenant.id);
  const quotaError = quotaRejection(used, capsFromTenant(tenant));
  if (quotaError) {
    throw new SendDispatchError(quotaError, 429);
  }

  const recipients = collectRecipientEmails(payload);
  const suppressed = await findSuppressedRecipients(tenant.id, recipients);
  if (suppressed.length > 0) {
    throw new SendDispatchError(
      `Recipient is suppressed: ${suppressed.join(', ')}`,
      422,
    );
  }

  const fromDomain = domainOf(payload.from);
  const domain = apiKey.domain_id
    ? await getDomainById(apiKey.domain_id)
    : await getDomainByName(fromDomain);

  if (!domain || domain.tenant_id !== tenant.id) {
    throw new SendDispatchError('Domain not found', 404);
  }
  if (domain.status !== 'verified') {
    throw new SendDispatchError(
      'Domain DNS is not verified. Publish MX, SPF, DKIM, and DMARC, then check records.',
      400,
    );
  }
  if (fromDomain !== domain.domain) {
    throw new SendDispatchError(
      `From email must be from domain: ${domain.domain}`,
      400,
    );
  }

  let messageId: string;
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | null = null;
  try {
    messageId = await sendOutboundEmail(tenant, payload, {
      domainName: domain.domain,
      selector: domain.dkim_selector,
      privateKeyPem: domain.dkim_private_key,
    });
  } catch (sendError: unknown) {
    status = 'failed';
    errorMessage =
      sendError instanceof Error ? sendError.message : String(sendError);
    messageId = `failed-${Date.now()}`;
  }

  const result = await query(
    `INSERT INTO email_logs (
      tenant_id, api_key_id, domain_id, from_email, to_emails, cc_emails,
      bcc_emails, subject, html_content, text_content, attachments, status,
      ses_message_id, error_message, channel
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      tenant.id,
      apiKey.id,
      domain.id,
      payload.from,
      JSON.stringify(payload.to),
      JSON.stringify(payload.cc || []),
      JSON.stringify(payload.bcc || []),
      payload.subject,
      payload.html || null,
      payload.text || null,
      JSON.stringify(payload.attachments || []),
      status,
      messageId,
      errorMessage,
      channel,
    ],
  );

  if (status === 'failed') {
    throw new SendDispatchError(errorMessage || 'Send failed', 502);
  }

  return {
    id: result.rows[0]?.id || messageId,
    from: payload.from,
    to: payload.to,
    created_at: new Date().toISOString(),
  };
}

export async function dispatchWithApiKey(
  apiKey: ApiKey,
  payload: SendEmailOptions,
  channel: IngressChannel,
) {
  const tenant = await getTenantById(apiKey.tenant_id);
  if (!tenant) {
    throw new SendDispatchError('Tenant not found', 404);
  }
  return dispatchTenantEmail({ tenant, apiKey, payload, channel });
}
