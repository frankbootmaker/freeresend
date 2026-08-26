import { generateKeyPairSync } from 'node:crypto';
import { promises as dns } from 'node:dns';

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
  selector = 'outpost',
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

export function generateSendingDnsRecords(input: {
  domain: string;
  outboundTransport: OutboundTransport;
  sesVerificationToken?: string | null;
  sesDkimTokens?: string[];
  sesRegion?: string;
  smtpMxHost?: string | null;
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
    records.push({
      type: 'TXT',
      name: mailFrom,
      value: 'v=spf1 include:amazonses.com ~all',
      ttl,
      purpose: 'spf',
      description: 'SPF on outbound — authorize Amazon SES for bounce MAIL FROM',
      required: true,
    });
    records.push({
      type: 'TXT',
      name: domain,
      value: 'v=spf1 include:amazonses.com ~all',
      ttl,
      purpose: 'spf',
      description:
        'SPF on the sending domain — include amazonses.com because egress is Amazon SES',
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
  } else {
    records.push({
      type: 'MX',
      name: mailFrom,
      value: smtpMxValue(input.smtpMxHost, domain),
      ttl,
      purpose: 'mx',
      description: 'MX on outbound — bounce MAIL FROM for SMTP egress',
      required: true,
    });
    records.push({
      type: 'TXT',
      name: domain,
      value: smtpSpfValue(input.smtpMxHost, domain),
      ttl,
      purpose: 'spf',
      description:
        'SPF on the sending domain — authorize the SMTP upstream, not Amazon SES',
      required: true,
    });
    const selector = input.dkimSelector || 'outpost';
    const publicKey = input.dkimPublicKey || '';
    records.push({
      type: 'TXT',
      name: `${selector}._domainkey.${domain}`,
      value: publicKey
        ? `v=DKIM1; k=rsa; p=${publicKey}`
        : 'v=DKIM1; k=rsa; p=',
      ttl,
      purpose: 'dkim',
      description: `DKIM TXT for selector ${selector}`,
      required: true,
      status: publicKey ? 'pending' : 'invalid',
      observed: publicKey ? null : 'DKIM key has not been generated',
    });
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

  return records;
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

function smtpSpfValue(host: string | null | undefined, domain: string): string {
  const target = host?.trim();
  if (!target || isLocalHost(target)) {
    return `v=spf1 mx:${outboundHost(domain)} ~all`;
  }
  if (isIpv4(target)) {
    return `v=spf1 ip4:${target} ~all`;
  }
  return `v=spf1 include:${normalizeHost(target)} ~all`;
}

function isLocalHost(value: string): boolean {
  const host = normalizeHost(value);
  return host === 'localhost' || host === 'mailhog' || host === '127.0.0.1';
}

function isIpv4(value: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value.trim());
}
