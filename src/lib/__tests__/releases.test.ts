/**
 * @jest-environment node
 */

import {
  APP_VERSION,
  RELEASES,
  UNRELEASED_VERSION,
  displayVersion,
} from '../releases';

describe('releases', () => {
  it('lists unreleased work first and still includes the installed version', () => {
    expect(RELEASES[0]?.version).toBe(UNRELEASED_VERSION);
    expect(RELEASES.some((release) => release.version === APP_VERSION)).toBe(true);
    expect(displayVersion()).toBe(`v${APP_VERSION}`);
  });

  it('uses ISO dates and at least one change per shipped release', () => {
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (release.version !== UNRELEASED_VERSION) {
        expect(release.changes.length).toBeGreaterThan(0);
      }
    }
  });
});
