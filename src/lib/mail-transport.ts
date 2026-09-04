import nodemailer from 'nodemailer';
import { query } from './database';
import { sendEmail as sendViaSes } from './ses';
import type { SendEmailOptions } from './ses';
import type { Tenant } from './tenants';
import { getTenantBySlug } from './tenants';
import { getResolvedPlatformSettings } from './platform-settings';
import { tenantSesSendAccount } from './tenant-ses';

export interface OutboundDkim {
  domainName?: string | null;
  selector?: string | null;
  privateKeyPem?: string | null;
}

type SmtpRelay = {
  host: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
};

async function sendViaSmtpRelay(
  smtp: SmtpRelay,
  options: SendEmailOptions,
  dkim?: OutboundDkim,
): Promise<string> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 587,
    secure: Boolean(smtp.secure),
    auth:
      smtp.username && smtp.password
        ? { user: smtp.username, pass: smtp.password }
        : undefined,
  });

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    dkim:
      dkim?.selector && dkim.privateKeyPem
        ? {
            domainName: dkim.domainName || options.from.split('@').pop() || '',
            keySelector: dkim.selector,
            privateKey: dkim.privateKeyPem,
          }
        : undefined,
  });

  return String(info.messageId || `smtp-${Date.now()}`);
}

export async function sendOutboundEmail(
  tenant: Tenant,
  options: SendEmailOptions,
  dkim?: OutboundDkim,
): Promise<string> {
  if (tenant.outbound_transport === 'smtp') {
    const tenantSmtp = tenant.smtp_upstream;
    if (tenantSmtp?.host) {
      return sendViaSmtpRelay(tenantSmtp, options, dkim);
    }

    const platform = await getResolvedPlatformSettings();
    if (platform.smtpEnabled && platform.smtpHost) {
      return sendViaSmtpRelay(
        {
          host: platform.smtpHost,
          port: platform.smtpPort,
          secure: platform.smtpSecure,
          username: platform.smtpUsername,
          password: platform.smtpPassword,
        },
        options,
        dkim,
      );
    }

    throw new Error('Tenant SMTP upstream is not configured');
  }

  return sendViaSes(options, tenantSesSendAccount(tenant));
}

export type PlatformMailVia = 'ses' | 'smtp';

function resolvePlatformVia(
  platform: Awaited<ReturnType<typeof getResolvedPlatformSettings>>,
  via?: PlatformMailVia,
): PlatformMailVia {
  if (via) return via;
  if (platform.sesAccessKeyId && platform.sesSecretAccessKey) return 'ses';
  return 'smtp';
}

async function sendViaPlatformSmtp(options: SendEmailOptions): Promise<string> {
  const platform = await getResolvedPlatformSettings();
  if (!platform.smtpHost) {
    throw new Error('Platform SMTP relay is not configured');
  }
  return sendViaSmtpRelay(
    {
      host: platform.smtpHost,
      port: platform.smtpPort,
      secure: platform.smtpSecure,
      username: platform.smtpUsername,
      password: platform.smtpPassword,
    },
    options,
  );
}

async function recordPlatformSystemEmailLog(input: {
  options: SendEmailOptions;
  messageId: string;
  status: 'sent' | 'failed';
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const tenant = await getTenantBySlug('platform');
    if (!tenant) {
      console.warn('No platform tenant; configuration test was not written to email logs');
      return;
    }
    await query(
      `INSERT INTO email_logs (
        tenant_id, from_email, to_emails, cc_emails, bcc_emails, subject,
        html_content, text_content, attachments, status, ses_message_id,
        error_message, channel
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        tenant.id,
        input.options.from,
        JSON.stringify(input.options.to),
        JSON.stringify(input.options.cc || []),
        JSON.stringify(input.options.bcc || []),
        input.options.subject,
        input.options.html || null,
        input.options.text || null,
        JSON.stringify(input.options.attachments || []),
        input.status,
        input.messageId,
        input.errorMessage || null,
        'platform',
      ],
    );
  } catch (error: unknown) {
    console.error('Failed to record platform system email', error);
  }
}

export async function sendPlatformSystemEmail(
  options: SendEmailOptions,
  via?: PlatformMailVia,
): Promise<string> {
  const platform = await getResolvedPlatformSettings();
  const resolved = resolvePlatformVia(platform, via);
  try {
    let messageId: string;
    if (resolved === 'ses') {
      if (!platform.sesAccessKeyId || !platform.sesSecretAccessKey) {
        throw new Error('Platform SES is not configured');
      }
      messageId = await sendViaSes(options);
    } else {
      if (via === 'smtp' && !platform.smtpEnabled) {
        throw new Error('Platform SMTP relay is disabled');
      }
      messageId = await sendViaPlatformSmtp(options);
    }
    await recordPlatformSystemEmailLog({
      options,
      messageId,
      status: 'sent',
    });
    return messageId;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    await recordPlatformSystemEmailLog({
      options,
      messageId: `failed-${Date.now()}`,
      status: 'failed',
      errorMessage,
    });
    throw error;
  }
}
