import nodemailer from 'nodemailer';
import { sendEmail as sendViaSes } from './ses';
import type { SendEmailOptions } from './ses';
import type { Tenant } from './tenants';
import { getResolvedPlatformSettings } from './platform-settings';

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

  return sendViaSes(options);
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

export async function sendPlatformSystemEmail(
  options: SendEmailOptions,
  via?: PlatformMailVia,
): Promise<string> {
  const platform = await getResolvedPlatformSettings();
  const resolved = resolvePlatformVia(platform, via);
  if (resolved === 'ses') {
    if (!platform.sesAccessKeyId || !platform.sesSecretAccessKey) {
      throw new Error('Platform SES is not configured');
    }
    return sendViaSes(options);
  }
  if (via === 'smtp' && !platform.smtpEnabled) {
    throw new Error('Platform SMTP relay is disabled');
  }
  return sendViaPlatformSmtp(options);
}
