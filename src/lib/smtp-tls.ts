import { X509Certificate } from 'node:crypto';

export type SmtpIngressTlsSource = 'letsencrypt' | 'manual';
export type SmtpIngressTlsStatus = 'idle' | 'pending' | 'issued' | 'error';

export const TLS_RENEW_BEFORE_MS = 30 * 24 * 60 * 60 * 1000;
export const TLS_PENDING_STALE_MS = 15 * 60 * 1000;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export function parseTlsSource(
  value: string | null | undefined,
): SmtpIngressTlsSource {
  return value === 'manual' ? 'manual' : 'letsencrypt';
}

export function parseTlsStatus(
  value: string | null | undefined,
): SmtpIngressTlsStatus {
  if (value === 'pending' || value === 'issued' || value === 'error') {
    return value;
  }
  return 'idle';
}

export function parseTlsHostname(value: string | null | undefined): string {
  let next = (value || '').trim().toLowerCase();
  if (!next) return '';
  next = next.replace(/^https?:\/\//, '');
  next = next.split('/')[0] || '';
  next = next.replace(/:\d+$/, '');
  next = next.replace(/\.$/, '');
  if (!next || /[\s@/?#]/.test(next)) return '';
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(next)) return '';
  return next;
}

export function isPublicTlsHostname(hostname: string): boolean {
  const host = parseTlsHostname(hostname);
  if (!host) return false;
  if (LOCAL_HOSTS.has(host) || host.endsWith('.localhost')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  return host.includes('.');
}

export function computeRenewAt(
  expiresAt: Date,
  now: Date = new Date(),
): Date {
  const renew = new Date(expiresAt.getTime() - TLS_RENEW_BEFORE_MS);
  return renew.getTime() <= now.getTime()
    ? now
    : renew;
}

export function isoDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function readCertificateExpiry(certPem: string): string {
  try {
    const x509 = new X509Certificate(certPem);
    return isoDate(x509.validTo);
  } catch {
    return '';
  }
}

export function certificateCoversHostname(
  certPem: string,
  hostname: string,
): boolean {
  const host = parseTlsHostname(hostname);
  if (!host || !certPem.trim()) return false;
  try {
    const x509 = new X509Certificate(certPem);
    const cn = x509.subject.match(/CN=([^,\n]+)/i)?.[1]?.trim().toLowerCase();
    if (cn === host) return true;
    const san = (x509.subjectAltName || '').toLowerCase();
    return san.split(/,\s*/).some((part) => {
      const dns = part.replace(/^dns:/, '').trim();
      return dns === host;
    });
  } catch {
    return false;
  }
}

export function findLongestZone(
  hostname: string,
  zones: string[],
): string | null {
  const host = parseTlsHostname(hostname);
  if (!host) return null;
  const matches = zones
    .map((zone) => parseTlsHostname(zone))
    .filter((zone) => zone && (host === zone || host.endsWith(`.${zone}`)))
    .sort((a, b) => b.length - a.length);
  return matches[0] || null;
}

export function acmeDnsRecordName(hostname: string, zone: string): string {
  const host = parseTlsHostname(hostname);
  const apex = parseTlsHostname(zone);
  if (!host || !apex) return '_acme-challenge';
  if (host === apex) return `_acme-challenge.${apex}`;
  return `_acme-challenge.${host}`;
}

export function shouldIssueLetsEncrypt(input: {
  source: SmtpIngressTlsSource;
  domain: string;
  status: SmtpIngressTlsStatus;
  statusAt?: string;
  certPem?: string;
  renewAt?: string;
  now?: Date;
  force?: boolean;
  pendingStaleMs?: number;
}): boolean {
  if (input.source !== 'letsencrypt') return false;
  if (!isPublicTlsHostname(input.domain)) return false;

  const now = input.now || new Date();
  if (input.status === 'pending') {
    const started = input.statusAt ? new Date(input.statusAt).getTime() : 0;
    const staleMs = input.pendingStaleMs ?? TLS_PENDING_STALE_MS;
    if (started && now.getTime() - started < staleMs && !input.force) {
      return false;
    }
  }

  if (input.force) return true;
  if (!(input.certPem || '').trim()) return true;
  if (!certificateCoversHostname(input.certPem || '', input.domain)) return true;
  if (input.renewAt && now.getTime() >= new Date(input.renewAt).getTime()) {
    return true;
  }
  return false;
}
