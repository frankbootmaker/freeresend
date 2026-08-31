/**
 * @jest-environment node
 */

import {
  LIVENESS_SERVICE,
  livenessFromPing,
  livenessStatusCode,
} from '../liveness';

const now = new Date('2026-09-01T00:00:00.000Z');

describe('livenessFromPing', () => {
  it('reports healthy when the database ping succeeds', () => {
    const body = livenessFromPing({
      ok: true,
      latencyMs: 4,
      version: '1.0.0',
      now,
    });

    expect(body).toEqual({
      status: 'healthy',
      timestamp: '2026-09-01T00:00:00.000Z',
      service: LIVENESS_SERVICE,
      version: '1.0.0',
      database: 'ok',
      latencyMs: 4,
    });
    expect(livenessStatusCode(body)).toBe(200);
  });

  it('reports unhealthy when the database ping fails', () => {
    const body = livenessFromPing({
      ok: false,
      version: '1.0.0',
      now,
    });

    expect(body).toEqual({
      status: 'unhealthy',
      timestamp: '2026-09-01T00:00:00.000Z',
      service: LIVENESS_SERVICE,
      version: '1.0.0',
      database: 'down',
    });
    expect(livenessStatusCode(body)).toBe(503);
  });
});
