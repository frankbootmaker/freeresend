import { sendPlatformSystemEmail } from './mail-transport';
import { GITHUB_REPO_URL } from './brand';
import { resolveMailLocale } from './mail-locale';
import {
  getResolvedPlatformSettings,
  platformSender,
} from './platform-settings';
import {
  emailInfoTable,
  renderSystemEmail,
} from './system-email';
import { systemMailCopy } from './system-mail-i18n';

export interface WaitlistNotificationData {
  email: string;
  estimatedVolume?: number;
  currentProvider?: string;
  referralSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  signupId: string;
  createdAt: string;
}

export async function sendWaitlistNotification(
  data: WaitlistNotificationData,
): Promise<void> {
  const settings = await getResolvedPlatformSettings();
  const adminEmail = settings.alertEmail;
  const fromEmail = platformSender(settings);

  if (!adminEmail) {
    console.warn('Alert email is not configured, skipping waitlist notification');
    return;
  }

  const locale = await resolveMailLocale({ email: adminEmail });
  const copy = systemMailCopy(locale);

  const utmInfo = [
    data.utmSource && `Source: ${data.utmSource}`,
    data.utmMedium && `Medium: ${data.utmMedium}`,
    data.utmCampaign && `Campaign: ${data.utmCampaign}`,
  ].filter(Boolean).join(' | ');

  const subject = copy.waitlistNotify.subject(data.email);
  const origin = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  const volume = copy.waitlistNotify.formatVolume(data.estimatedVolume);
  const unspecified = copy.waitlistNotify.unspecified;
  const signupTime = new Date(data.createdAt).toLocaleString(copy.dateLocale);
  const rows = [
    { label: copy.waitlistNotify.email, value: data.email, emphasize: true },
    { label: copy.waitlistNotify.volume, value: volume },
    {
      label: copy.waitlistNotify.provider,
      value: data.currentProvider || unspecified,
    },
    {
      label: copy.waitlistNotify.referral,
      value: data.referralSource || unspecified,
    },
    { label: copy.waitlistNotify.signupTime, value: signupTime },
    { label: copy.waitlistNotify.signupId, value: data.signupId },
  ];
  if (utmInfo) {
    rows.push({ label: copy.waitlistNotify.utm, value: utmInfo });
  }

  const { html, text } = renderSystemEmail({
    title: copy.waitlistNotify.title,
    lead: copy.waitlistNotify.lead,
    bodyHtml:
      emailInfoTable(rows)
      + `<p style="margin:0;color:#5c7266;font:400 14px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;">`
      + `${copy.waitlistNotify.review}</p>`,
    bodyText: [
      `${copy.waitlistNotify.email}: ${data.email}`,
      `${copy.waitlistNotify.volume}: ${volume}`,
      `${copy.waitlistNotify.provider}: ${data.currentProvider || unspecified}`,
      `${copy.waitlistNotify.referral}: ${data.referralSource || unspecified}`,
      `${copy.waitlistNotify.signupTime}: ${signupTime}`,
      `${copy.waitlistNotify.signupId}: ${data.signupId}`,
      utmInfo ? `${copy.waitlistNotify.utm}: ${utmInfo}` : '',
    ].filter(Boolean).join('\n'),
    cta: origin
      ? { label: copy.waitlistNotify.cta, href: `${origin}/admin/waitlist` }
      : undefined,
    footerNote: copy.waitlistNotify.footer,
  });

  try {
    await sendPlatformSystemEmail({
      from: `RelayHorizon Notifications <${fromEmail}>`,
      to: [adminEmail],
      subject,
      html,
      text,
      tags: {
        type: 'waitlist_notification',
        signup_id: data.signupId,
      },
    });
    console.log(`Waitlist notification sent to ${adminEmail} for signup: ${data.email}`);
  } catch (error) {
    console.error('Failed to send waitlist notification:', error);
  }
}

export async function sendWelcomeEmail(
  email: string,
  signupId: string,
  localeHint?: unknown,
): Promise<void> {
  const settings = await getResolvedPlatformSettings();
  const fromEmail = platformSender(settings);
  const locale = await resolveMailLocale({ email, requested: localeHint });
  const copy = systemMailCopy(locale);
  const welcome = copy.waitlistWelcome;

  const { html, text } = renderSystemEmail({
    title: welcome.title,
    lead: welcome.lead,
    bodyHtml: `
      <p style="margin:0 0 14px;">${welcome.thanks}</p>
      <p style="margin:0 0 8px;font-weight:600;">${welcome.expectTitle}</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#1a2f24;">
        <li style="margin:0 0 8px;">${welcome.expect1}</li>
        <li style="margin:0 0 8px;">${welcome.expect2}</li>
        <li style="margin:0 0 8px;">${welcome.expect3}</li>
      </ul>
      <p style="margin:0;">${welcome.whileYouWait}</p>
    `,
    bodyText: [
      welcome.thanks,
      welcome.lead,
      '',
      `${welcome.expectTitle}:`,
      `- ${welcome.expect1}`,
      `- ${welcome.expect2}`,
      `- ${welcome.expect3}`,
      '',
      `Self-hosted: ${GITHUB_REPO_URL}`,
      `Signup ID: ${signupId}`,
    ].join('\n'),
    cta: {
      label: welcome.cta,
      href: GITHUB_REPO_URL,
    },
    footerNote: welcome.footer(signupId),
  });

  try {
    await sendPlatformSystemEmail({
      from: `RelayHorizon <${fromEmail}>`,
      to: [email],
      subject: welcome.subject,
      html,
      text,
      tags: {
        type: 'waitlist_welcome',
        signup_id: signupId,
      },
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
  }
}
