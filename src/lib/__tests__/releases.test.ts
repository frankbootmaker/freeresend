/**
 * @jest-environment node
 */

import { APP_VERSION, RELEASES, displayVersion } from '../releases';

describe('releases', () => {
  it('lists the current version first', () => {
    expect(RELEASES[0]?.version).toBe(APP_VERSION);
    expect(displayVersion()).toBe(`v${APP_VERSION}`);
  });

  it('uses ISO dates and at least one change per release', () => {
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.changes.length).toBeGreaterThan(0);
    }
  });
});
