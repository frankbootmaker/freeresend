/**
 * @jest-environment node
 */

import {
  emailInfoTable,
  renderSystemEmail,
  SYSTEM_EMAIL_COLORS,
} from '../system-email';

describe('renderSystemEmail', () => {
  it('wraps content in RelayHorizon brand chrome', () => {
    const { html, text } = renderSystemEmail({
      title: 'Reset your password',
      lead: 'Expires in one hour.',
      bodyHtml: '<p>Body copy</p>',
      bodyText: 'Body copy',
      cta: { label: 'Choose a new password', href: 'https://example.com/reset' },
      footerNote: 'Password reset notice.',
    });

    expect(html).toContain('RelayHorizon');
    expect(html).toContain('Nethorizon');
    expect(html).toContain(SYSTEM_EMAIL_COLORS.accent);
    expect(html).toContain(SYSTEM_EMAIL_COLORS.bg);
    expect(html).toContain('Reset your password');
    expect(html).toContain('Choose a new password');
    expect(html).toContain('https://example.com/reset');
    expect(html).toContain('Password reset notice.');
    expect(text).toContain('RelayHorizon. by Nethorizon');
    expect(text).toContain('Body copy');
    expect(text).toContain('Choose a new password: https://example.com/reset');
  });

  it('escapes title and CTA values', () => {
    const { html } = renderSystemEmail({
      title: '<script>alert(1)</script>',
      bodyHtml: '<p>Safe</p>',
      bodyText: 'Safe',
      cta: { label: 'Go', href: 'https://example.com/?a="b"' },
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('https://example.com/?a=&quot;b&quot;');
  });
});

describe('emailInfoTable', () => {
  it('renders labeled rows', () => {
    const table = emailInfoTable([
      { label: 'Email', value: 'ops@example.com', emphasize: true },
      { label: 'Volume', value: '1,000 emails/month' },
    ]);
    expect(table).toContain('Email');
    expect(table).toContain('ops@example.com');
    expect(table).toContain('1,000 emails/month');
  });
});
