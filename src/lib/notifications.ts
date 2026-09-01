import { sendPlatformSystemEmail } from './mail-transport';
import { GITHUB_REPO_URL } from './brand';
import {
  getResolvedPlatformSettings,
  platformSender,
} from './platform-settings';
import {
  emailInfoTable,
  renderSystemEmail,
} from './system-email';

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

function formatVolume(volume?: number): string {
  if (volume === undefined || volume === null) return 'Not specified';
  return `${volume.toLocaleString()} emails/month`;
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

  const utmInfo = [
    data.utmSource && `Source: ${data.utmSource}`,
    data.utmMedium && `Medium: ${data.utmMedium}`,
    data.utmCampaign && `Campaign: ${data.utmCampaign}`,
  ].filter(Boolean).join(' | ');

  const subject = `New waitlist signup: ${data.email}`;
  const origin = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  const rows = [
    { label: 'Email', value: data.email, emphasize: true },
    { label: 'Expected volume', value: formatVolume(data.estimatedVolume) },
    { label: 'Current provider', value: data.currentProvider || 'Not specified' },
    { label: 'Referral source', value: data.referralSource || 'Not specified' },
    { label: 'Signup time', value: new Date(data.createdAt).toLocaleString() },
    { label: 'Signup ID', value: data.signupId },
  ];
  if (utmInfo) {
    rows.push({ label: 'UTM', value: utmInfo });
  }

  const { html, text } = renderSystemEmail({
    title: 'New waitlist signup',
    lead: 'Someone joined the RelayHorizon hosted waitlist.',
    bodyHtml:
      emailInfoTable(rows)
      + `<p style="margin:0;color:#5c7266;font:400 14px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;">`
      + `Review volume for tier planning, and reach out if they look like a high-volume prospect.</p>`,
    bodyText: [
      `Email: ${data.email}`,
      `Expected volume: ${formatVolume(data.estimatedVolume)}`,
      `Current provider: ${data.currentProvider || 'Not specified'}`,
      `Referral source: ${data.referralSource || 'Not specified'}`,
      `Signup time: ${new Date(data.createdAt).toLocaleString()}`,
      `Signup ID: ${data.signupId}`,
      utmInfo ? `UTM: ${utmInfo}` : '',
    ].filter(Boolean).join('\n'),
    cta: origin
      ? { label: 'View waitlist', href: `${origin}/admin/waitlist` }
      : undefined,
    footerNote: 'Sent because someone joined the hosted waitlist.',
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
): Promise<void> {
  const settings = await getResolvedPlatformSettings();
  const fromEmail = platformSender(settings);
  const subject = 'You are on the RelayHorizon waitlist';

  const { html, text } = renderSystemEmail({
    title: 'You are on the waitlist',
    lead: 'We will notify you when the hosted service is ready.',
    bodyHtml: `
      <p style="margin:0 0 14px;">Thanks for joining the RelayHorizon hosted waitlist.
      You are in line for early access to the managed outbound email service.</p>
      <p style="margin:0 0 8px;font-weight:600;">What to expect</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#1a2f24;">
        <li style="margin:0 0 8px;">Lower cost than many premium transactional providers</li>
        <li style="margin:0 0 8px;">We run the infrastructure; you keep the Resend-compatible API</li>
        <li style="margin:0 0 8px;">Point <code style="font-family:SFMono-Regular,Consolas,monospace;font-size:13px;">RESEND_BASE_URL</code> at your instance when it is live</li>
      </ul>
      <p style="margin:0;">While you wait, you can try the open-source self-hosted build on GitHub.</p>
    `,
    bodyText: [
      'Thanks for joining the RelayHorizon hosted waitlist.',
      'We will notify you when the hosted service is ready.',
      '',
      'What to expect:',
      '- Lower cost than many premium transactional providers',
      '- We run the infrastructure; you keep the Resend-compatible API',
      '- Point RESEND_BASE_URL at your instance when it is live',
      '',
      `Self-hosted: ${GITHUB_REPO_URL}`,
      `Signup ID: ${signupId}`,
    ].join('\n'),
    cta: {
      label: 'Explore self-hosted',
      href: GITHUB_REPO_URL,
    },
    footerNote: `You are receiving this because you joined the waitlist. Signup ID: ${signupId}`,
  });

  try {
    await sendPlatformSystemEmail({
      from: `RelayHorizon <${fromEmail}>`,
      to: [email],
      subject,
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
