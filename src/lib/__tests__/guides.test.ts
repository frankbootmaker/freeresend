/**
 * @jest-environment node
 */

import { LOCALES } from '../i18n';
import { getGuide } from '../guides';

describe('getGuide', () => {
  it('returns admin and tenant sections for every locale', () => {
    for (const locale of LOCALES) {
      const admin = getGuide('admin', locale);
      const tenant = getGuide('tenant', locale);
      expect(admin.sections.length).toBeGreaterThanOrEqual(6);
      expect(tenant.sections.length).toBeGreaterThanOrEqual(5);
      expect(admin.sections.every((section) => section.paragraphs.length > 0)).toBe(
        true,
      );
      expect(tenant.sections.every((section) => section.paragraphs.length > 0)).toBe(
        true,
      );
    }
  });

  it('covers BYO approve, unfreeze, dual DNS, and Abuse in every locale', () => {
    const markers: Record<
      string,
      {
        adminByo: RegExp;
        adminUnfreeze: RegExp;
        tenantAbuse: RegExp;
        tenantByoRequest: RegExp;
        tenantDualDns: RegExp;
        tenantKeyPin: RegExp;
      }
    > = {
      en: {
        adminByo: /Approve or Deny/i,
        adminUnfreeze: /unfreeze from Manage/i,
        tenantAbuse: /HTTP 423/,
        tenantByoRequest: /Request bring-your-own SES/,
        tenantDualDns: /Both SES and SMTP record sets/,
        tenantKeyPin: /Auto \(follows Sending\)/,
      },
      de: {
        adminByo: /genehmigen oder ablehnen/i,
        adminUnfreeze: /entsperren Sie in Verwalten/,
        tenantAbuse: /HTTP 423/,
        tenantByoRequest: /Eigenes SES anfragen/,
        tenantDualDns: /SES- und SMTP-Recordsätze/,
        tenantKeyPin: /Auto folgt Versand/,
      },
      hu: {
        adminByo: /hagyja jóvá vagy utasítsa el/,
        adminUnfreeze: /kezelésben.*oldja fel/,
        tenantAbuse: /HTTP 423/,
        tenantByoRequest: /Saját SES kérése/,
        tenantDualDns: /SES és az SMTP rekordkészlet/,
        tenantKeyPin: /Auto a Küldés lapot követi/,
      },
    };

    for (const locale of LOCALES) {
      const expected = markers[locale];
      const admin = getGuide('admin', locale);
      const tenant = getGuide('tenant', locale);
      const adminText = admin.sections.flatMap((section) => section.paragraphs).join('\n');
      const tenantText = tenant.sections.flatMap((section) => section.paragraphs).join('\n');

      expect(tenant.sections.some((section) => section.id === 'abuse')).toBe(true);
      expect(admin.sections.some((section) => section.id === 'abuse')).toBe(true);
      expect(admin.sections.some((section) => section.id === 'ses-events')).toBe(
        true,
      );
      expect(adminText).toMatch(/Amazon SNS/);
      expect(adminText).toMatch(expected.adminByo);
      expect(adminText).toMatch(expected.adminUnfreeze);
      expect(tenantText).toMatch(expected.tenantAbuse);
      expect(tenantText).toMatch(expected.tenantByoRequest);
      expect(tenantText).toMatch(expected.tenantDualDns);
      expect(tenantText).toMatch(expected.tenantKeyPin);
    }
  });
});
