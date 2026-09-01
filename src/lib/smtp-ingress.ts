import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { SMTPServerOptions } from 'smtp-server';
import {
  parsePortList,
  resolveSmtpListenPorts,
  SMTP_INGRESS_PORTS,
  type EnvLike,
} from './smtp-listen';
import type { ResolvedPlatformSettings } from './platform-settings';

export type SmtpIngressTlsMode = 'off' | 'starttls' | 'required';

export type SmtpTlsMaterial = {
  cert?: Buffer;
  key?: Buffer;
  source: 'none' | 'settings' | 'path' | 'env';
  fingerprint: string;
};

export function normalizeSmtpListenPorts(ports: number[]): number[] {
  const allowed = new Set<number>(SMTP_INGRESS_PORTS);
  const next = [...new Set(ports.filter((port) => allowed.has(port)))];
  if (next.length === 0) return [2525, 587];
  return next.sort((a, b) => {
    if (a === 587) return -1;
    if (b === 587) return 1;
    return a - b;
  });
}

export function serializeListenPorts(ports: number[]): string {
  return normalizeSmtpListenPorts(ports).join(',');
}

export function parseTlsMode(
  value: string | null | undefined,
): SmtpIngressTlsMode {
  if (value === 'starttls' || value === 'required') return value;
  return 'off';
}

export function listenPortsFromStored(
  stored: string | null | undefined,
  env: EnvLike = process.env,
): number[] {
  const fromRow = parsePortList(stored || undefined);
  if (fromRow.length > 0) return normalizeSmtpListenPorts(fromRow);
  return normalizeSmtpListenPorts(resolveSmtpListenPorts(env));
}

function readOptionalFile(path: string | undefined): Buffer | undefined {
  if (!path) return undefined;
  try {
    return readFileSync(path);
  } catch {
    return undefined;
  }
}

function fileStamp(path: string | undefined): string {
  if (!path) return '';
  try {
    return String(statSync(path).mtimeMs);
  } catch {
    return '';
  }
}

export function tlsMaterialFromPlatform(
  settings: Pick<
    ResolvedPlatformSettings,
    'smtpIngressTlsCert' | 'smtpIngressTlsKey'
  >,
  env: NodeJS.ProcessEnv = process.env,
): SmtpTlsMaterial {
  return loadSmtpTlsMaterial({
    certPem: settings.smtpIngressTlsCert,
    keyPem: settings.smtpIngressTlsKey,
    certPath: env.SMTP_TLS_CERT_PATH,
    keyPath: env.SMTP_TLS_KEY_PATH,
    certEnv: env.SMTP_TLS_CERT,
    keyEnv: env.SMTP_TLS_KEY,
  });
}

export function loadSmtpTlsMaterial(input: {
  certPem?: string;
  keyPem?: string;
  certPath?: string;
  keyPath?: string;
  certEnv?: string;
  keyEnv?: string;
}): SmtpTlsMaterial {
  const settingsCert = (input.certPem || '').trim();
  const settingsKey = (input.keyPem || '').trim();
  if (settingsCert && settingsKey) {
    return {
      cert: Buffer.from(settingsCert),
      key: Buffer.from(settingsKey),
      source: 'settings',
      fingerprint: hashMaterial(settingsCert, settingsKey, 'settings'),
    };
  }

  const pathCert = readOptionalFile(input.certPath);
  const pathKey = readOptionalFile(input.keyPath);
  if (pathCert && pathKey) {
    return {
      cert: pathCert,
      key: pathKey,
      source: 'path',
      fingerprint: hashMaterial(
        pathCert.toString('utf8'),
        pathKey.toString('utf8'),
        `path:${fileStamp(input.certPath)}:${fileStamp(input.keyPath)}`,
      ),
    };
  }

  const envCert = (input.certEnv || '').trim();
  const envKey = (input.keyEnv || '').trim();
  if (envCert && envKey) {
    return {
      cert: Buffer.from(envCert),
      key: Buffer.from(envKey),
      source: 'env',
      fingerprint: hashMaterial(envCert, envKey, 'env'),
    };
  }

  return { source: 'none', fingerprint: 'none' };
}

function hashMaterial(cert: string, key: string, source: string): string {
  return createHash('sha256')
    .update(source)
    .update(cert)
    .update(key)
    .digest('hex')
    .slice(0, 16);
}

export function implicitTlsForPort(port: number): boolean {
  return port === 465;
}

export function canListenOnPort(
  port: number,
  tls: SmtpTlsMaterial,
): boolean {
  if (port === 465 && (!tls.cert || !tls.key)) return false;
  return true;
}

export function smtpTlsOptionsForPort(
  port: number,
  mode: SmtpIngressTlsMode,
  tls: SmtpTlsMaterial,
): Pick<
  SMTPServerOptions,
  'secure' | 'key' | 'cert' | 'disabledCommands' | 'allowInsecureAuth'
> {
  const hasTls = Boolean(tls.cert && tls.key);
  const implicit = implicitTlsForPort(port) && hasTls;
  const offerStartTls = hasTls && !implicit && mode !== 'off';

  return {
    secure: implicit,
    key: hasTls ? tls.key : undefined,
    cert: hasTls ? tls.cert : undefined,
    disabledCommands: offerStartTls ? [] : ['STARTTLS'],
    allowInsecureAuth: mode !== 'required',
  };
}
