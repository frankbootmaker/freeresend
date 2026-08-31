import { BRAND_NAME, BRAND_VENDOR } from '@/lib/brand';

/**
 * Email-safe hex approximations of the light RelayHorizon tokens
 * (`src/app/relayhorizon-tokens.css`). Clients rarely support oklch.
 */
export const SYSTEM_EMAIL_COLORS = {
  bg: '#f3f5ef',
  surface: '#fbfcf8',
  surface2: '#e7ece3',
  fg: '#1a2f24',
  muted: '#5c7266',
  border: '#c4d0c6',
  accent: '#9ad63f',
  accentInk: '#14261c',
} as const;

export type SystemEmailCta = {
  label: string;
  href: string;
};

export type SystemEmailInput = {
  /** Primary heading inside the card */
  title: string;
  /** Optional one-line support under the title */
  lead?: string;
  /** HTML for the body (already escaped where needed) */
  bodyHtml: string;
  /** Plain-text body (without brand chrome) */
  bodyText: string;
  cta?: SystemEmailCta;
  /** Extra footer line under the brand credit */
  footerNote?: string;
  /** Document <title> / preview; defaults to title */
  preview?: string;
};

export type SystemEmailParts = {
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailInfoRows(
  rows: Array<{ label: string; value: string; emphasize?: boolean }>,
): string {
  return rows
    .map((row) => {
      const value = escapeHtml(row.value);
      const styled = row.emphasize
        ? `<span style="background:${SYSTEM_EMAIL_COLORS.surface2};color:${SYSTEM_EMAIL_COLORS.fg};padding:2px 8px;font-weight:600;">${value}</span>`
        : value;
      return (
        `<tr>`
        + `<td style="padding:10px 0;border-bottom:1px solid ${SYSTEM_EMAIL_COLORS.border};`
        + `font:600 13px/1.4 'Avenir Next',Avenir,'Segoe UI',sans-serif;`
        + `color:${SYSTEM_EMAIL_COLORS.muted};width:38%;vertical-align:top;">`
        + `${escapeHtml(row.label)}</td>`
        + `<td style="padding:10px 0;border-bottom:1px solid ${SYSTEM_EMAIL_COLORS.border};`
        + `font:400 14px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;`
        + `color:${SYSTEM_EMAIL_COLORS.fg};vertical-align:top;">${styled}</td>`
        + `</tr>`
      );
    })
    .join('');
}

export function emailInfoTable(
  rows: Array<{ label: string; value: string; emphasize?: boolean }>,
): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" `
    + `style="margin:8px 0 20px;border-collapse:collapse;">`
    + emailInfoRows(rows)
    + `</table>`
  );
}

/**
 * Shared HTML/text chrome for platform system mail.
 * Table layout + inline styles for common clients.
 */
export function renderSystemEmail(input: SystemEmailInput): SystemEmailParts {
  const c = SYSTEM_EMAIL_COLORS;
  const preview = escapeHtml(input.preview || input.title);
  const title = escapeHtml(input.title);
  const lead = input.lead
    ? `<p style="margin:10px 0 0;font:400 15px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.muted};">${escapeHtml(input.lead)}</p>`
    : '';
  const cta = input.cta
    ? (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">`
      + `<tr><td style="background:${c.accent};">`
      + `<a href="${escapeHtml(input.cta.href)}" `
      + `style="display:inline-block;padding:12px 22px;font:600 14px/1.2 'Avenir Next',Avenir,'Segoe UI',sans-serif;`
      + `color:${c.accentInk};text-decoration:none;">`
      + `${escapeHtml(input.cta.label)}</a>`
      + `</td></tr></table>`
    )
    : '';
  const footerNote = input.footerNote
    ? `<p style="margin:0 0 8px;font:400 12px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.muted};">${escapeHtml(input.footerNote)}</p>`
    : '';
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${preview}</title>
</head>
<body style="margin:0;padding:0;background:${c.bg};color:${c.fg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:${c.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background:${c.surface};border:1px solid ${c.border};">
          <tr>
            <td style="padding:22px 28px 18px;border-bottom:1px solid ${c.border};">
              <p style="margin:0;font:700 18px/1.2 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.fg};letter-spacing:-0.02em;">
                ${escapeHtml(BRAND_NAME)}<span style="color:${c.accent};">.</span>
              </p>
              <p style="margin:6px 0 0;font:500 11px/1.2 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.muted};letter-spacing:0.08em;text-transform:uppercase;">
                by ${escapeHtml(BRAND_VENDOR)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${c.accent};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0;font:700 22px/1.25 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.fg};letter-spacing:-0.02em;">
                ${title}
              </h1>
              ${lead}
              <div style="margin:22px 0 0;font:400 15px/1.55 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.fg};">
                ${input.bodyHtml}
              </div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${c.border};background:${c.surface2};">
              ${footerNote}
              <p style="margin:0;font:400 12px/1.5 'Avenir Next',Avenir,'Segoe UI',sans-serif;color:${c.muted};">
                ${escapeHtml(BRAND_NAME)}. by ${escapeHtml(BRAND_VENDOR)} · ${year}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    `${BRAND_NAME}. by ${BRAND_VENDOR}`,
    '',
    input.title,
    input.lead || '',
    '',
    input.bodyText.trim(),
  ];
  if (input.cta) {
    textParts.push('', `${input.cta.label}: ${input.cta.href}`);
  }
  if (input.footerNote) {
    textParts.push('', input.footerNote);
  }
  textParts.push('', `${BRAND_NAME}. by ${BRAND_VENDOR}`);

  return {
    html,
    text: textParts.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n'),
  };
}
