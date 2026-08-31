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
});
