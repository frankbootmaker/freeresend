export const SMTP_INGRESS_PORTS = [2525, 587, 465] as const;
export type SmtpIngressPort = (typeof SMTP_INGRESS_PORTS)[number];

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
  env: NodeJS.ProcessEnv = process.env,
): number[] {
  const fromList = parsePortList(env.SMTP_LISTEN_PORTS);
  if (fromList.length > 0) return fromList;

  const primary = Number(env.SMTP_LISTEN_PORT);
  if (Number.isInteger(primary) && primary > 0) {
    return primary === 587 ? [587] : [primary, 587];
  }
  return [...DEFAULT_LISTEN_PORTS];
}

export function resolveSmtpPublicPorts(
  env: NodeJS.ProcessEnv = process.env,
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
