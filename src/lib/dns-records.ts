import { generateKeyPairSync } from 'node:crypto';
import { promises as dns } from 'node:dns';
import { DEFAULT_DKIM_SELECTOR } from './brand';

export type DnsPurpose = 'mx' | 'spf' | 'dkim' | 'dmarc' | 'ses_verify';
export type DnsRecordStatus = 'pending' | 'valid' | 'invalid';
export type OutboundTransport = 'ses' | 'smtp';

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  purpose: DnsPurpose;
  description?: string;
  required: boolean;
  status?: DnsRecordStatus;
  observed?: string | null;
  lane?: OutboundTransport;
}

export interface DkimKeyPair {
  selector: string;
  privateKeyPem: string;
  publicKeyPem: string;
  publicKeyBase64: string;
}

const REQUIRED_PURPOSES: DnsPurpose[] = ['mx', 'spf', 'dkim', 'dmarc'];

export function skipDnsVerification(): boolean {
  return process.env.SKIP_DNS_VERIFICATION === 'true';
}

export function generateDkimKeyPair(
  selector = DEFAULT_DKIM_SELECTOR,
): DkimKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {
    selector,
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    publicKeyBase64: pemToBase64(publicKey),
  };
}

export function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
}

export function resolveSmtpDnsHost(input: {
  tenantSmtpHost?: string | null;
  platformSmtpHost?: string | null;
}): string | null {
  const tenant = input.tenantSmtpHost?.trim();
  if (tenant) return tenant;
  const platform = input.platformSmtpHost?.trim();
  return platform || null;
}

export function generateSendingDnsRecords(input: {
  domain: string;
  outboundTransport: OutboundTransport;
  sesVerificationToken?: string | null;
  sesDkimTokens?: string[];
  sesRegion?: string;
  smtpMxHost?: string | null;
  platformSmtpHost?: string | null;
  dkimSelector?: string | null;
  dkimPublicKey?: string | null;
}): DnsRecord[] {
  const domain = input.domain.toLowerCase();
  const records: DnsRecord[] = [];
  const ttl = 300;

  const mailFrom = outboundHost(domain);

  if (input.outboundTransport === 'ses') {
    const region = input.sesRegion || process.env.AWS_REGION || 'us-east-1';
    records.push({
      type: 'MX',
      name: mailFrom,
      value: `10 inbound-smtp.${region}.amazonaws.com.`,
      ttl,
      purpose: 'mx',
      description:
        'MX on outbound — SES bounce MAIL FROM. The target host is Amazon’s (inbound-smtp); this does not receive your mail.',
      required: true,
    });
    const sesSpf = sesSpfValue(input.platformSmtpHost, domain);
    const failoverReady = smtpSpfMechanisms(input.platformSmtpHost, domain).length > 0;
    records.push({
      type: 'TXT',
      name: mailFrom,
      value: sesSpf,
      ttl,
      purpose: 'spf',
      description: failoverReady
        ? 'SPF on outbound — Amazon SES plus the platform SMTP relay for failover'
        : 'SPF on outbound — authorize Amazon SES for bounce MAIL FROM',
      required: true,
    });
    records.push({
      type: 'TXT',
      name: domain,
      value: sesSpf,
      ttl,
      purpose: 'spf',
      description: failoverReady
        ? 'SPF on the sending domain — Amazon SES plus the platform SMTP relay so failover can send without a DNS change'
        : 'SPF on the sending domain — include amazonses.com because egress is Amazon SES',
      required: true,
    });
    if (input.sesVerificationToken) {
      records.push({
        type: 'TXT',
        name: `_amazonses.${domain}`,
        value: input.sesVerificationToken,
        ttl,
        purpose: 'ses_verify',
        description: 'Amazon SES domain verification',
        required: true,
      });
    }
    const tokens = input.sesDkimTokens || [];
    if (tokens.length === 0) {
      records.push({
        type: 'CNAME',
        name: `_domainkey.${domain}`,
        value: '',
        ttl,
        purpose: 'dkim',
        description: 'DKIM — Amazon SES tokens are created when the domain is added with AWS credentials',
        required: true,
        status: 'invalid',
        observed: 'SES DKIM tokens are not available yet',
      });
    } else {
      tokens.forEach((token) => {
        records.push({
          type: 'CNAME',
          name: `${token}._domainkey.${domain}`,
          value: `${token}.dkim.amazonses.com.`,
          ttl,
          purpose: 'dkim',
          description: `DKIM CNAME (${token.slice(0, 8)}…)`,
          required: true,
        });
      });
    }
    if (failoverReady) {
      records.push(
        relayDkimRecord({
          domain,
          selector: input.dkimSelector || DEFAULT_DKIM_SELECTOR,
          publicKey: input.dkimPublicKey || '',
          ttl,
          description:
            'RelayHorizon DKIM — publish now so platform SMTP failover can sign without a DNS change',
        }),
      );
    }
  } else {
    const smtpHost = resolveSmtpDnsHost({
      tenantSmtpHost: input.smtpMxHost,
      platformSmtpHost: input.platformSmtpHost,
    });
    const viaPlatform = !input.smtpMxHost?.trim() && Boolean(smtpHost);
    records.push({
      type: 'MX',
      name: mailFrom,
      value: smtpMxValue(smtpHost, domain),
      ttl,
      purpose: 'mx',
      description: viaPlatform
        ? 'MX on outbound — bounce MAIL FROM for the platform SMTP relay'
        : 'MX on outbound — bounce MAIL FROM for your SMTP upstream',
      required: true,
    });
    records.push({
      type: 'TXT',
      name: mailFrom,
      value: smtpSpfValue(smtpHost, domain),
      ttl,
      purpose: 'spf',
      description: viaPlatform
        ? 'SPF on outbound — authorize the platform SMTP relay for bounce MAIL FROM'
        : 'SPF on outbound — authorize your SMTP upstream for bounce MAIL FROM',
      required: true,
    });
    records.push({
      type: 'TXT',
      name: domain,
      value: smtpSpfValue(smtpHost, domain),
      ttl,
      purpose: 'spf',
      description: viaPlatform
        ? 'SPF on the sending domain — authorize the platform SMTP relay, not Amazon SES'
        : 'SPF on the sending domain — authorize your SMTP upstream, not Amazon SES',
      required: true,
    });
    records.push(
      relayDkimRecord({
        domain,
        selector: input.dkimSelector || DEFAULT_DKIM_SELECTOR,
        publicKey: input.dkimPublicKey || '',
        ttl,
        description:
          `DKIM TXT for selector ${input.dkimSelector || DEFAULT_DKIM_SELECTOR} — RelayHorizon signs; the SMTP relay only forwards`,
      }),
    );
  }

  records.push({
    type: 'TXT',
    name: `_dmarc.${domain}`,
    value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
    ttl,
    purpose: 'dmarc',
    description: 'DMARC — tell receivers how to handle authentication failures',
    required: true,
  });

  return records.map((record) => ({
    ...record,
    lane: input.outboundTransport,
  }));
}

export function generateDualSendingDnsRecords(
  input: Omit<Parameters<typeof generateSendingDnsRecords>[0], 'outboundTransport'>,
): DnsRecord[] {
  return [
    ...generateSendingDnsRecords({ ...input, outboundTransport: 'ses' }),
    ...generateSendingDnsRecords({ ...input, outboundTransport: 'smtp' }),
  ];
}

export function inferRecordLane(
  record: Pick<DnsRecord, 'lane' | 'type' | 'value' | 'purpose'>,
): OutboundTransport {
  if (record.lane === 'ses' || record.lane === 'smtp') return record.lane;
  if (record.purpose === 'ses_verify') return 'ses';
  if (record.type === 'CNAME' && /amazonses/i.test(record.value || '')) return 'ses';
  if (record.purpose === 'dkim' && record.type === 'TXT') return 'smtp';
  if (record.purpose === 'mx' && /inbound-smtp|amazonses/i.test(record.value || '')) {
    return 'ses';
  }
  if (record.purpose === 'mx') return 'smtp';
  if (record.purpose === 'spf' && /amazonses/i.test(record.value || '')) return 'ses';
  if (record.purpose === 'spf') return 'smtp';
  return 'ses';
}

export function recordsForLane(
  records: DnsRecord[],
  lane: OutboundTransport,
): DnsRecord[] {
  return records.filter((record) => inferRecordLane(record) === lane);
}

export function hasSendingLane(
  records: DnsRecord[],
  lane: OutboundTransport,
): boolean {
  return records.some(
    (record) => inferRecordLane(record) === lane && record.purpose !== 'dmarc',
  );
}

export function dnsRecordSignature(records: DnsRecord[]): string {
  return records
    .map((record) => (
      `${inferRecordLane(record)}\0${record.type}\0${record.name}\0${record.value}`
    ))
    .sort()
    .join('\n');
}

export function mergeDnsRecordStatuses(
  next: DnsRecord[],
  previous: DnsRecord[],
  resetLanes: OutboundTransport[] = [],
): DnsRecord[] {
  return next.map((record) => {
    const lane = inferRecordLane(record);
    if (resetLanes.includes(lane)) {
      return {
        ...record,
        lane,
        status: 'pending' as const,
        observed: null,
      };
    }
    const prior = previous.find((candidate) => {
      if (inferRecordLane(candidate) !== lane) return false;
      if (candidate.type !== record.type) return false;
      if (normalizeHost(candidate.name) !== normalizeHost(record.name)) {
        return false;
      }
      return normalizeDnsValue(candidate) === normalizeDnsValue(record);
    });
    return {
      ...record,
      lane,
      status: prior?.status || record.status || 'pending',
      observed: prior?.observed ?? record.observed ?? null,
    };
  });
}

export function extractSesDkimTokens(records: DnsRecord[]): string[] {
  return records
    .filter(
      (record) =>
        record.purpose === 'dkim' &&
        record.type === 'CNAME' &&
        /\.dkim\.amazonses\.com/i.test(record.value),
    )
    .map((record) => record.name.split('._domainkey.')[0])
    .filter(Boolean);
}

export function normalizeHost(value: string): string {
  return value.trim().replace(/\.$/, '').toLowerCase();
}

export function normalizeDnsValue(record: Pick<DnsRecord, 'type' | 'value' | 'purpose'>): string {
  const raw = record.value.trim().replace(/^"+|"+$/g, '');
  if (record.type === 'MX') {
    const parts = raw.split(/\s+/);
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
      return `${parts[0]} ${normalizeHost(parts.slice(1).join(' '))}`;
    }
    return `10 ${normalizeHost(raw)}`;
  }
  if (record.type === 'CNAME') {
    return normalizeHost(raw);
  }
  return normalizeTxt(raw);
}

export function recordMatches(expected: DnsRecord, observed: string[]): boolean {
  if (observed.length === 0) return false;
  const want = normalizeDnsValue(expected);
  return observed.some((item) => normalizeDnsValue({
    type: expected.type,
    value: item,
    purpose: expected.purpose,
  }) === want);
}

export function allRequiredRecordsValid(records: DnsRecord[]): boolean {
  const required = records.filter((record) => record.required);
  if (required.length === 0) return false;
  const purposes = new Set(
    required
      .filter((record) => record.status === 'valid')
      .map((record) => record.purpose),
  );
  return REQUIRED_PURPOSES.every((purpose) => purposes.has(purpose))
    && required.every((record) => record.status === 'valid');
}

export async function lookupObservedValues(record: DnsRecord): Promise<string[]> {
  try {
    if (record.type === 'MX') {
      const rows = await dns.resolveMx(record.name);
      return rows.map((row) => `${row.priority} ${row.exchange}`);
    }
    if (record.type === 'CNAME') {
      const rows = await dns.resolveCname(record.name);
      return rows;
    }
    const chunks = await dns.resolveTxt(record.name);
    return chunks.map((parts) => parts.join(''));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (
      code === 'ENODATA'
      || code === 'ENOTFOUND'
      || code === 'ESERVFAIL'
      || code === 'ENOTIMP'
    ) {
      return [];
    }
    throw error;
  }
}

export async function checkDnsRecords(records: DnsRecord[]): Promise<DnsRecord[]> {
  const checked: DnsRecord[] = [];
  for (const record of records) {
    if (!record.value || /p=$/i.test(record.value.replace(/\s+/g, ''))) {
      checked.push({
        ...record,
        status: 'invalid',
        observed: record.observed || 'Record value is incomplete',
      });
      continue;
    }
    try {
      const observed = await lookupObservedValues(record);
      const matched = recordMatches(record, observed);
      checked.push({
        ...record,
        status: matched ? 'valid' : 'invalid',
        observed: observed[0] || null,
      });
    } catch (error) {
      checked.push({
        ...record,
        status: 'invalid',
        observed: error instanceof Error ? error.message : 'DNS lookup failed',
      });
    }
  }
  return checked;
}

function normalizeTxt(value: string): string {
  const compact = value.replace(/"/g, '').replace(/\s+/g, '');
  const dkimKey = compact.match(/p=([^;]*)/i);
  if (/v=dkim1/i.test(compact)) {
    return `v=dkim1;k=rsa;p=${dkimKey?.[1] || ''}`;
  }
  return compact.toLowerCase();
}

function outboundHost(domain: string): string {
  return `outbound.${domain}`;
}

function smtpMxValue(host: string | null | undefined, domain: string): string {
  const target = host?.trim();
  if (!target || isLocalHost(target) || isIpv4(target)) {
    return `10 ${outboundHost(domain)}.`;
  }
  return `10 ${normalizeHost(target)}.`;
}

function smtpSpfMechanisms(
  host: string | null | undefined,
  domain: string,
): string[] {
  const target = host?.trim();
  if (!target || isLocalHost(target)) return [];
  if (isIpv4(target)) return [`ip4:${target}`];
  const hostname = normalizeHost(target);
  const parent = parentDomain(hostname);
  if (parent && parent !== hostname && parent !== domain) {
    return [`a:${hostname}`, `include:${parent}`];
  }
  return [`a:${hostname}`];
}

function smtpSpfValue(host: string | null | undefined, domain: string): string {
  const mechanisms = smtpSpfMechanisms(host, domain);
  if (mechanisms.length === 0) {
    return `v=spf1 mx:${outboundHost(domain)} ~all`;
  }
  return `v=spf1 ${mechanisms.join(' ')} ~all`;
}

function sesSpfValue(
  platformSmtpHost: string | null | undefined,
  domain: string,
): string {
  const mechanisms = smtpSpfMechanisms(platformSmtpHost, domain);
  if (mechanisms.length === 0) {
    return 'v=spf1 include:amazonses.com ~all';
  }
  return `v=spf1 include:amazonses.com ${mechanisms.join(' ')} ~all`;
}

function relayDkimRecord(input: {
  domain: string;
  selector: string;
  publicKey: string;
  ttl: number;
  description: string;
}): DnsRecord {
  const publicKey = input.publicKey;
  return {
    type: 'TXT',
    name: `${input.selector}._domainkey.${input.domain}`,
    value: publicKey
      ? `v=DKIM1; k=rsa; p=${publicKey}`
      : 'v=DKIM1; k=rsa; p=',
    ttl: input.ttl,
    purpose: 'dkim',
    description: input.description,
    required: true,
    status: publicKey ? 'pending' : 'invalid',
    observed: publicKey ? null : 'DKIM key has not been generated',
  };
}

function parentDomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length < 3) return null;
  return parts.slice(1).join('.');
}

function isLocalHost(value: string): boolean {
  const host = normalizeHost(value);
  return host === 'localhost' || host === 'mailhog' || host === '127.0.0.1';
}

function isIpv4(value: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value.trim());
}
