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

import {
  BACKUP_HEALTH_DETAIL,
  backupHealthFromStamps,
  overallFromChecks,
  type HealthCheck,
} from '../platform-health';

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
        check('backup', 'ok'),
      ]),
    ).toBe('down');
  });

  it('is down when the last backup failed', () => {
    expect(
      overallFromChecks([
        check('database', 'ok'),
        check('ses', 'ok'),
        check('smtp', 'off'),
        check('backup', 'down'),
      ]),
    ).toBe('down');
  });
});

describe('backupHealthFromStamps', () => {
  const now = Date.parse('2026-08-31T12:00:00.000Z');

  it('is ok when the last dump is fresh', () => {
    expect(
      backupHealthFromStamps({
        lastSuccessAt: '2026-08-31T10:00:00.000Z',
        heartbeatAt: '2026-08-31T11:55:00.000Z',
        scheduleEnabled: true,
        staleAfterHours: 36,
        now,
      }),
    ).toEqual({ state: 'ok', detail: BACKUP_HEALTH_DETAIL.fresh });
  });

  it('warns when no dump has been recorded', () => {
    expect(
      backupHealthFromStamps({
        scheduleEnabled: false,
        staleAfterHours: 36,
        now,
      }),
    ).toEqual({ state: 'warn', detail: BACKUP_HEALTH_DETAIL.missing });
  });

  it('warns when the last dump is stale', () => {
    expect(
      backupHealthFromStamps({
        lastSuccessAt: '2026-08-29T10:00:00.000Z',
        heartbeatAt: '2026-08-31T11:55:00.000Z',
        scheduleEnabled: true,
        staleAfterHours: 36,
        now,
      }),
    ).toEqual({ state: 'warn', detail: BACKUP_HEALTH_DETAIL.stale });
  });

  it('warns when the scheduler is enabled but has no heartbeat', () => {
    expect(
      backupHealthFromStamps({
        lastSuccessAt: '2026-08-31T10:00:00.000Z',
        scheduleEnabled: true,
        staleAfterHours: 36,
        now,
      }),
    ).toEqual({ state: 'warn', detail: BACKUP_HEALTH_DETAIL.schedulerMissing });
  });

  it('is down when the last failure is newer than the last success', () => {
    expect(
      backupHealthFromStamps({
        lastSuccessAt: '2026-08-31T08:00:00.000Z',
        lastFailureAt: '2026-08-31T09:00:00.000Z',
        heartbeatAt: '2026-08-31T09:00:00.000Z',
        scheduleEnabled: true,
        staleAfterHours: 36,
        now,
      }),
    ).toEqual({ state: 'down', detail: BACKUP_HEALTH_DETAIL.failed });
  });
});
