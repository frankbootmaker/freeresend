import nodemailer from 'nodemailer';
import { sendEmail as sendViaSes } from './ses';
import type { SendEmailOptions } from './ses';
import type { Tenant } from './tenants';

export interface OutboundDkim {
  domainName?: string | null;
  selector?: string | null;
  privateKeyPem?: string | null;
}

export async function sendOutboundEmail(
  tenant: Tenant,
  options: SendEmailOptions,
  dkim?: OutboundDkim,
): Promise<string> {
  if (tenant.outbound_transport === 'smtp') {
    const smtp = tenant.smtp_upstream;
    if (!smtp?.host) {
      throw new Error('Tenant SMTP upstream is not configured');
    }

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

  return sendViaSes(options);
}
