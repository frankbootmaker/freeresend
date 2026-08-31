export const LIVENESS_SERVICE = 'RelayHorizon';

export type LivenessResult = {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  database: 'ok' | 'down';
  latencyMs?: number;
};

export function livenessFromPing(input: {
  ok: boolean;
  latencyMs?: number;
  version?: string;
  now?: Date;
}): LivenessResult {
  const version = input.version ?? process.env.npm_package_version ?? '1.0.0';
  const timestamp = (input.now ?? new Date()).toISOString();

  if (input.ok) {
    return {
      status: 'healthy',
      timestamp,
      service: LIVENESS_SERVICE,
      version,
      database: 'ok',
      latencyMs: input.latencyMs,
    };
  }

  return {
    status: 'unhealthy',
    timestamp,
    service: LIVENESS_SERVICE,
    version,
    database: 'down',
  };
}

export function livenessStatusCode(result: LivenessResult): number {
  return result.status === 'healthy' ? 200 : 503;
}
