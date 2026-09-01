import { createHash } from 'crypto';
import { hashPassword, randomToken } from './auth-crypto';
import { query } from './database';
import { sendPlatformSystemEmail } from './mail-transport';
import { resolveMailLocale } from './mail-locale';
import { requestOrigin } from './oidc';
import {
  getResolvedPlatformSettings,
  platformSender,
} from './platform-settings';
import { renderSystemEmail } from './system-email';
import { systemMailCopy } from './system-mail-i18n';

export const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function resetLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/login/reset?token=${encodeURIComponent(token)}`;
}

export async function requestPasswordReset(
  email: string,
  origin: string,
  requestedLocale?: unknown,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const found = await query(
    'SELECT id FROM users WHERE lower(email) = $1 LIMIT 1',
    [normalized],
  );
  const userId = found.rows[0]?.id as string | undefined;
  if (!userId) {
    return;
  }

  const recent = await query(
    `SELECT created_at FROM password_reset_tokens
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const lastAt = recent.rows[0]?.created_at
    ? new Date(recent.rows[0].created_at).getTime()
    : 0;
  if (lastAt && Date.now() - lastAt < RESEND_COOLDOWN_MS) {
    return;
  }

  await query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );

  const token = randomToken(32);
  const expires = new Date(Date.now() + RESET_TTL_MS);
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashResetToken(token), expires],
  );

  const settings = await getResolvedPlatformSettings();
  const from = platformSender(settings);
  const link = resetLink(origin, token);
  const locale = await resolveMailLocale({
    userId,
    email: normalized,
    requested: requestedLocale,
  });
  const copy = systemMailCopy(locale).passwordReset;
  const { html, text } = renderSystemEmail({
    title: copy.title,
    lead: copy.lead,
    bodyHtml:
      copy.bodyHtml
      + `<p style="margin:0;color:#5c7266;font-size:14px;">${copy.ignore}</p>`,
    bodyText: copy.bodyText(link),
    cta: { label: copy.cta, href: link },
    footerNote: copy.footer,
  });
  try {
    await sendPlatformSystemEmail({
      from,
      to: [normalized],
      subject: copy.subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
      [hashResetToken(token)],
    );
  }
}

export async function completePasswordReset(
  token: string,
  password: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  const hash = hashResetToken(token.trim());
  const found = await query(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [hash],
  );
  const row = found.rows[0] as { id?: string; user_id?: string } | undefined;
  if (!row?.id || !row.user_id) {
    return { error: 'This reset link is invalid or has expired' };
  }
  const passwordHash = await hashPassword(trimmed);
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [
    row.user_id,
    passwordHash,
  ]);
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [row.user_id],
  );
  return { ok: true };
}

export function passwordResetOrigin(headers: Headers): string {
  return requestOrigin(headers);
}
