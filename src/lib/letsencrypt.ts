import * as acme from 'acme-client';
import {
  createDNSRecord,
  deleteDNSRecord,
  getDomains,
} from '@/lib/digitalocean';
import {
  forgetAcmeHttpChallenge,
  getResolvedPlatformSettings,
  rememberAcmeHttpChallenge,
  renewAtFromExpiry,
  updateTlsIssuanceState,
} from '@/lib/platform-settings';
import {
  findLongestZone,
  isPublicTlsHostname,
  parseTlsHostname,
  shouldIssueLetsEncrypt,
} from '@/lib/smtp-tls';

const DNS_PROPAGATION_MS = 20_000;

let inFlight: Promise<boolean> | null = null;

function directoryUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.ACME_DIRECTORY_URL) return env.ACME_DIRECTORY_URL;
  return env.LETSENCRYPT_STAGING === 'true'
    ? acme.directory.letsencrypt.staging
    : acme.directory.letsencrypt.production;
}

async function resolveDoZone(hostname: string): Promise<string | null> {
  if (!process.env.DO_API_TOKEN) return null;
  try {
    const domains = await getDomains();
    return findLongestZone(hostname, domains.map((domain) => domain.name));
  } catch (error) {
    console.warn(
      'Let’s Encrypt: DigitalOcean zone lookup failed',
      (error as Error).message,
    );
    return null;
  }
}

export async function maybeIssueLetsEncryptCertificate(
  force = false,
): Promise<boolean> {
  if (inFlight) return inFlight;
  inFlight = issueIfNeeded(force).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function issueIfNeeded(force: boolean): Promise<boolean> {
  const settings = await getResolvedPlatformSettings();
  if (
    !shouldIssueLetsEncrypt({
      source: settings.smtpIngressTlsSource,
      domain: settings.smtpIngressTlsDomain,
      status: settings.smtpIngressTlsStatus,
      statusAt: settings.smtpIngressTlsStatusAt,
      certPem: settings.smtpIngressTlsCert,
      renewAt: settings.smtpIngressTlsRenewAt,
      force,
    })
  ) {
    return false;
  }

  const domain = parseTlsHostname(settings.smtpIngressTlsDomain);
  if (!isPublicTlsHostname(domain)) {
    await updateTlsIssuanceState({
      status: 'error',
      error: 'Enter a public hostname before requesting a certificate.',
    });
    return false;
  }

  await updateTlsIssuanceState({
    status: 'pending',
    error: null,
  });

  try {
    const email = (
      process.env.ACME_EMAIL
      || settings.alertEmail
      || process.env.ADMIN_EMAIL
      || ''
    ).trim();
    const accountKey = settings.smtpIngressAcmeAccountKey
      || (await acme.crypto.createPrivateKey()).toString('utf8');
    const client = new acme.Client({
      directoryUrl: directoryUrl(),
      accountKey,
    });

    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: email ? [`mailto:${email}`] : undefined,
    });

    const [key, csr] = await acme.crypto.createCsr({
      commonName: domain,
    });

    const zone = await resolveDoZone(domain);
    const createdRecords: Array<{ zone: string; id: number }> = [];

    const certificate = await client.auto({
      csr,
      email: email || undefined,
      termsOfServiceAgreed: true,
      challengePriority: zone ? ['dns-01', 'http-01'] : ['http-01'],
      challengeCreateFn: async (_authz, challenge, keyAuthorization) => {
        if (challenge.type === 'http-01') {
          rememberAcmeHttpChallenge(challenge.token, keyAuthorization);
          await updateTlsIssuanceState({
            httpToken: challenge.token,
            httpKeyAuth: keyAuthorization,
          });
          return;
        }
        if (challenge.type === 'dns-01' && zone) {
          const record = await createDNSRecord(zone, {
            type: 'TXT',
            name: `_acme-challenge.${domain}`,
            value: keyAuthorization,
            ttl: 30,
          });
          createdRecords.push({ zone, id: record.id });
          await new Promise((resolve) => {
            setTimeout(resolve, DNS_PROPAGATION_MS);
          });
        }
      },
      challengeRemoveFn: async (_authz, challenge) => {
        if (challenge.type === 'http-01') {
          forgetAcmeHttpChallenge(challenge.token);
          await updateTlsIssuanceState({
            httpToken: null,
            httpKeyAuth: null,
          });
        }
        if (challenge.type === 'dns-01') {
          await Promise.all(
            createdRecords.splice(0).map((record) =>
              deleteDNSRecord(record.zone, record.id).catch((error) => {
                console.warn(
                  'Let’s Encrypt: failed to remove DNS challenge',
                  (error as Error).message,
                );
              }),
            ),
          );
        }
      },
    });

    const info = acme.crypto.readCertificateInfo(certificate);
    const expiresAt = info.notAfter;
    const certPem = certificate.toString();
    const keyPem = key.toString('utf8');

    await updateTlsIssuanceState({
      status: 'issued',
      error: null,
      cert: certPem,
      key: keyPem,
      expiresAt,
      renewAt: renewAtFromExpiry(expiresAt),
      accountKey,
      httpToken: null,
      httpKeyAuth: null,
    });
    console.log(`Let’s Encrypt certificate issued for ${domain}`);
    return true;
  } catch (error) {
    const message = (error as Error).message || 'Certificate request failed';
    console.error('Let’s Encrypt issuance failed:', error);
    await updateTlsIssuanceState({
      status: 'error',
      error: message,
    });
    return false;
  }
}
