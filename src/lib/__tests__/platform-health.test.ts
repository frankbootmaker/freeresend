/**
 * @jest-environment node
 */

jest.mock('../database', () => ({
  query: jest.fn(),
}));

jest.mock('../platform-settings', () => ({
  getResolvedPlatformSettings: jest.fn(),
}));

jest.mock('../ses', () => ({
  getSesSendQuota: jest.fn(),
}));

import { overallFromChecks, type HealthCheck } from '../platform-health';

function check(
  id: HealthCheck['id'],
  state: HealthCheck['state'],
): HealthCheck {
  return { id, state, detail: state };
}

describe('overallFromChecks', () => {
  it('is ok when every required check is ok or off', () => {
    expect(
      overallFromChecks([
        check('database', 'ok'),
        check('ses', 'ok'),
        check('smtp', 'off'),
      ]),
    ).toBe('ok');
  });

  it('is degraded when a check warns', () => {
    expect(
      overallFromChecks([
        check('database', 'ok'),
        check('ses', 'warn'),
        check('smtp', 'off'),
      ]),
    ).toBe('degraded');
  });

  it('is down when the database is down', () => {
    expect(
      overallFromChecks([
        check('database', 'down'),
        check('ses', 'ok'),
        check('smtp', 'ok'),
      ]),
    ).toBe('down');
  });
});
