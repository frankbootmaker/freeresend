import { isPublicTlsHostname } from '@/lib/smtp-tls';
import { hostnameFromPublicUrl } from '@/lib/system-domain-name';

export const SMTP_INGRESS_PORTS = [2525, 587, 465] as const;
export type SmtpIngressPort = (typeof SMTP_INGRESS_PORTS)[number];
export type EnvLike = Record<string, string | undefined>;

const DEFAULT_LISTEN_PORTS = [2525, 587];
const ALLOWED = new Set<number>(SMTP_INGRESS_PORTS);

export function parsePortList(value: string | undefined): number[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((port) => ALLOWED.has(port)),
    ),
  ];
}

export function resolveSmtpListenPorts(
  env: EnvLike = process.env,
): number[] {
  const fromList = parsePortList(env.SMTP_LISTEN_PORTS);
  if (fromList.length > 0) return fromList;

  const primary = Number(env.SMTP_LISTEN_PORT);
  if (Number.isInteger(primary) && primary > 0) {
    return primary === 587 ? [587] : [primary, 587];
  }
  return [...DEFAULT_LISTEN_PORTS];
}

export function resolveSmtpPublicHost(
  env: EnvLike = process.env,
  extras: { tlsDomain?: string; requestOrigin?: string } = {},
): string {
  const candidates = [
    hostnameFromPublicUrl(env.SMTP_PUBLIC_HOST),
    hostnameFromPublicUrl(extras.tlsDomain || env.SMTP_TLS_DOMAIN),
    hostnameFromPublicUrl(env.NEXTAUTH_URL),
    hostnameFromPublicUrl(extras.requestOrigin),
  ].filter(Boolean);
  const publicHost = candidates.find((host) => isPublicTlsHostname(host));
  return publicHost || candidates[0] || 'localhost';
}

export function resolveSmtpPublicPorts(
  env: EnvLike = process.env,
  listenPorts?: number[],
): { port: number; ports: number[] } {
  const fromList = parsePortList(env.SMTP_PUBLIC_PORTS);
  const ports =
    fromList.length > 0
      ? fromList
      : listenPorts && listenPorts.length > 0
        ? listenPorts
        : resolveSmtpListenPorts(env);
  const preferred = Number(env.SMTP_PUBLIC_PORT);
  const port =
    Number.isInteger(preferred) && ports.includes(preferred)
      ? preferred
      : ports.includes(587)
        ? 587
        : ports[0];
  const ordered = [...ports].sort((a, b) => {
    if (a === 587) return -1;
    if (b === 587) return 1;
    return a - b;
  });
  return { port, ports: ordered };
}
