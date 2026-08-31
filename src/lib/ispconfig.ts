import https from 'node:https';
import axios from 'axios';

export type IspconfigConfig = {
  apiUrl: string;
  username: string;
  password: string;
  insecure: boolean;
};

type IspconfigEnvelope = {
  code?: string;
  message?: string;
  response?: unknown;
};

export function normalizeIspconfigApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/json\.php$/i.test(trimmed)) return trimmed;
  return `${trimmed}/remote/json.php`;
}

export function ispconfigZoneCandidates(hostname: string): string[] {
  const host = hostname.replace(/\.$/, '').toLowerCase();
  const labels = host.split('.').filter(Boolean);
  const zones: string[] = [];
  for (let i = 0; i < labels.length - 1; i += 1) {
    zones.push(`${labels.slice(i).join('.')}.`);
  }
  return zones;
}

function numericId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
}

async function ispconfigCall(
  config: IspconfigConfig,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const apiUrl = normalizeIspconfigApiUrl(config.apiUrl);
  if (!apiUrl) {
    throw new Error('ISPConfig API URL is missing.');
  }
  const response = await axios.post<IspconfigEnvelope>(
    `${apiUrl}?${method}`,
    body,
    {
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: config.insecure
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
      validateStatus: () => true,
    },
  );
  const data = response.data;
  if (!data || typeof data !== 'object') {
    throw new Error(`ISPConfig ${method} returned an empty response`);
  }
  if (data.code && data.code !== 'ok') {
    throw new Error(data.message || `ISPConfig ${method} failed (${data.code})`);
  }
  return data.response;
}

export async function withIspconfigSession<T>(
  config: IspconfigConfig,
  run: (sessionId: string) => Promise<T>,
): Promise<T> {
  const sessionId = String(
    await ispconfigCall(config, 'login', {
      username: config.username,
      password: config.password,
      client_login: false,
    }) || '',
  );
  if (!sessionId) {
    throw new Error('ISPConfig login did not return a session.');
  }
  try {
    return await run(sessionId);
  } finally {
    await ispconfigCall(config, 'logout', { session_id: sessionId }).catch(
      () => undefined,
    );
  }
}

async function resolveZone(
  config: IspconfigConfig,
  sessionId: string,
  hostname: string,
): Promise<{ zoneId: number; serverId: number; clientId: number }> {
  for (const origin of ispconfigZoneCandidates(hostname)) {
    const zone = asRecord(
      await ispconfigCall(config, 'dns_zone_get', {
        session_id: sessionId,
        primary_id: { origin },
      }),
    );
    const zoneId = numericId(zone?.id);
    const serverId = numericId(zone?.server_id);
    const sysUserId = numericId(zone?.sys_userid);
    if (!zoneId || !serverId || !sysUserId) continue;
    const clientId = numericId(
      await ispconfigCall(config, 'client_get_id', {
        session_id: sessionId,
        sys_userid: sysUserId,
      }),
    );
    if (!clientId) {
      throw new Error('ISPConfig client_get_id did not return a client id.');
    }
    return { zoneId, serverId, clientId };
  }
  throw new Error(
    `No ISPConfig DNS zone matches ${hostname}. Create the zone or use DNS TXT.`,
  );
}

export async function ispconfigAddTxt(
  config: IspconfigConfig,
  hostname: string,
  value: string,
): Promise<number> {
  return withIspconfigSession(config, async (sessionId) => {
    const { zoneId, serverId, clientId } = await resolveZone(
      config,
      sessionId,
      hostname,
    );
    const name = `_acme-challenge.${hostname.replace(/\.$/, '')}.`;
    const recordId = numericId(
      await ispconfigCall(config, 'dns_txt_add', {
        session_id: sessionId,
        client_id: clientId,
        update_serial: true,
        params: {
          server_id: serverId,
          zone: zoneId,
          name,
          type: 'txt',
          data: value,
          aux: '0',
          ttl: '3600',
          active: 'y',
          stamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          serial: String(Math.floor(Date.now() / 1000)),
        },
      }),
    );
    if (!recordId) {
      throw new Error('ISPConfig did not return a TXT record id.');
    }
    return recordId;
  });
}

export async function ispconfigRemoveTxt(
  config: IspconfigConfig,
  hostname: string,
  recordId?: number,
): Promise<void> {
  await withIspconfigSession(config, async (sessionId) => {
    let primaryId = recordId;
    if (!primaryId) {
      const name = `_acme-challenge.${hostname.replace(/\.$/, '')}.`;
      const record = asRecord(
        await ispconfigCall(config, 'dns_txt_get', {
          session_id: sessionId,
          primary_id: { name, type: 'TXT' },
        }),
      );
      primaryId = numericId(record?.id) || undefined;
    }
    if (!primaryId) return;
    await ispconfigCall(config, 'dns_txt_delete', {
      session_id: sessionId,
      primary_id: primaryId,
      update_serial: true,
    });
  });
}
