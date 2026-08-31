import * as acme from 'acme-client';
import type { Order } from 'acme-client';
import type { Challenge } from 'acme-client/types/rfc8555';
import {
  createDNSRecord,
  deleteDNSRecord,
  getDomains,
} from '@/lib/digitalocean';
import {
  ispconfigAddTxt,
  ispconfigRemoveTxt,
  type IspconfigConfig,
} from '@/lib/ispconfig';
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
  parseStoredAcmeOrder,
  parseTlsHostname,
  shouldIssueLetsEncrypt,
  type AcmeChallengeMethod,
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

function challengePriority(
  method: AcmeChallengeMethod,
): string[] {
  if (method === 'http-01') return ['http-01'];
  return ['dns-01'];
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

export async function continueManualDnsCertificate(): Promise<boolean> {
  if (inFlight) return inFlight;
  inFlight = completeManualDns().finally(() => {
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
      challenge: settings.smtpIngressAcmeChallenge,
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

  if (settings.smtpIngressAcmeChallenge === 'dns-manual') {
    return startManualDns(domain);
  }

  return completeAutomaticIssue(domain, settings.smtpIngressAcmeChallenge);
}

async function createClient(accountKeyPem?: string, email?: string) {
  const accountKey = accountKeyPem
    || (await acme.crypto.createPrivateKey()).toString('utf8');
  const client = new acme.Client({
    directoryUrl: directoryUrl(),
    accountKey,
  });
  await client.createAccount({
    termsOfServiceAgreed: true,
    contact: email ? [`mailto:${email}`] : undefined,
  });
  return { client, accountKey };
}

function contactEmail(
  settings: { alertEmail: string },
): string {
  return (
    process.env.ACME_EMAIL
    || settings.alertEmail
    || process.env.ADMIN_EMAIL
    || ''
  ).trim();
}

async function startManualDns(domain: string): Promise<boolean> {
  const settings = await getResolvedPlatformSettings();
  await updateTlsIssuanceState({
    status: 'pending',
    error: null,
    challenge: 'dns-manual',
  });

  try {
    const email = contactEmail(settings);
    const { client, accountKey } = await createClient(
      settings.smtpIngressAcmeAccountKey,
      email,
    );
    const [key, csr] = await acme.crypto.createCsr({ commonName: domain });
    const order = await client.createOrder({
      identifiers: [{ type: 'dns', value: domain }],
    });
    const authorizations = await client.getAuthorizations(order);
    const challenge = authorizations
      .flatMap((authz) => authz.challenges)
      .find((item) => item.type === 'dns-01');
    if (!challenge) {
      throw new Error('Let’s Encrypt did not offer a DNS-01 challenge');
    }
    const dnsValue = await client.getChallengeKeyAuthorization(challenge);
    const dnsName = `_acme-challenge.${domain}`;

    await updateTlsIssuanceState({
      status: 'waiting_dns',
      error: null,
      accountKey,
      dnsName,
      dnsValue,
      orderJson: JSON.stringify({
        orderUrl: order.url,
        challengeUrl: challenge.url,
        csr: csr.toString(),
        key: key.toString('utf8'),
      }),
    });
    return true;
  } catch (error) {
    return failIssuance(error);
  }
}

async function completeManualDns(): Promise<boolean> {
  const settings = await getResolvedPlatformSettings();
  const stored = parseStoredAcmeOrder(settings.smtpIngressAcmeOrder);
  if (!stored) {
    await updateTlsIssuanceState({
      status: 'error',
      error: 'No pending DNS challenge. Issue a certificate first.',
    });
    return false;
  }

  await updateTlsIssuanceState({ status: 'pending', error: null });

  try {
    const { client, accountKey } = await createClient(
      settings.smtpIngressAcmeAccountKey,
      contactEmail(settings),
    );
    const order = await client.getOrder({ url: stored.orderUrl } as Order);
    const challenge = {
      type: 'dns-01',
      url: stored.challengeUrl,
    } as Challenge;
    await client.completeChallenge(challenge);
    await client.waitForValidStatus(challenge);
    await client.finalizeOrder(order, stored.csr);
    const certificate = await client.getCertificate(order);
    return storeIssuedCertificate(certificate, stored.key, accountKey);
  } catch (error) {
    await updateTlsIssuanceState({ status: 'waiting_dns' });
    return failIssuance(error, false);
  }
}

async function completeAutomaticIssue(
  domain: string,
  method: AcmeChallengeMethod,
): Promise<boolean> {
  const settings = await getResolvedPlatformSettings();
  await updateTlsIssuanceState({
    status: 'pending',
    error: null,
    challenge: method,
  });

  try {
    const ispconfig = ispconfigConfigFromSettings(settings);
    if (method === 'dns-digitalocean') {
      const zone = await resolveDoZone(domain);
      if (!process.env.DO_API_TOKEN) {
        throw new Error(
          'DigitalOcean DNS needs DO_API_TOKEN on this installation.',
        );
      }
      if (!zone) {
        throw new Error(
          `No DigitalOcean zone matches ${domain}. Add the zone or use DNS TXT.`,
        );
      }
    }
    if (method === 'dns-ispconfig') {
      if (!ispconfig) {
        throw new Error(
          'ISPConfig needs an API URL, remote user, and password.',
        );
      }
    }

    const email = contactEmail(settings);
    const { client, accountKey } = await createClient(
      settings.smtpIngressAcmeAccountKey,
      email,
    );
    const [key, csr] = await acme.crypto.createCsr({ commonName: domain });
    const zone = method === 'dns-digitalocean'
      ? await resolveDoZone(domain)
      : null;
    const createdRecords: Array<{
      provider: 'digitalocean' | 'ispconfig';
      zone?: string;
      id: number;
    }> = [];

    const certificate = await client.auto({
      csr,
      email: email || undefined,
      termsOfServiceAgreed: true,
      challengePriority: challengePriority(method),
      challengeCreateFn: async (_authz, challenge, keyAuthorization) => {
        if (challenge.type === 'http-01') {
          rememberAcmeHttpChallenge(challenge.token, keyAuthorization);
          await updateTlsIssuanceState({
            httpToken: challenge.token,
            httpKeyAuth: keyAuthorization,
          });
          return;
        }
        if (challenge.type === 'dns-01' && method === 'dns-digitalocean' && zone) {
          const record = await createDNSRecord(zone, {
            type: 'TXT',
            name: `_acme-challenge.${domain}`,
            value: keyAuthorization,
            ttl: 30,
          });
          createdRecords.push({
            provider: 'digitalocean',
            zone,
            id: record.id,
          });
          await new Promise((resolve) => {
            setTimeout(resolve, DNS_PROPAGATION_MS);
          });
        }
        if (challenge.type === 'dns-01' && method === 'dns-ispconfig' && ispconfig) {
          const recordId = await ispconfigAddTxt(
            ispconfig,
            domain,
            keyAuthorization,
          );
          createdRecords.push({ provider: 'ispconfig', id: recordId });
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
            createdRecords.splice(0).map((record) => {
              if (record.provider === 'digitalocean' && record.zone) {
                return deleteDNSRecord(record.zone, record.id).catch((error) => {
                  console.warn(
                    'Let’s Encrypt: failed to remove DNS challenge',
                    (error as Error).message,
                  );
                });
              }
              if (record.provider === 'ispconfig' && ispconfig) {
                return ispconfigRemoveTxt(ispconfig, domain, record.id).catch(
                  (error) => {
                    console.warn(
                      'Let’s Encrypt: failed to remove ISPConfig TXT',
                      (error as Error).message,
                    );
                  },
                );
              }
              return Promise.resolve();
            }),
          );
        }
      },
    });

    return storeIssuedCertificate(
      certificate,
      key.toString('utf8'),
      accountKey,
    );
  } catch (error) {
    return failIssuance(error);
  }
}

async function storeIssuedCertificate(
  certificate: string,
  keyPem: string,
  accountKey: string,
): Promise<boolean> {
  const info = acme.crypto.readCertificateInfo(certificate);
  const expiresAt = info.notAfter;
  await updateTlsIssuanceState({
    status: 'issued',
    error: null,
    cert: certificate.toString(),
    key: keyPem,
    expiresAt,
    renewAt: renewAtFromExpiry(expiresAt),
    accountKey,
    httpToken: null,
    httpKeyAuth: null,
    dnsName: null,
    dnsValue: null,
    orderJson: null,
  });
  console.log('Let’s Encrypt certificate issued');
  return true;
}

function ispconfigConfigFromSettings(settings: {
  smtpIngressIspconfigUrl: string;
  smtpIngressIspconfigUser: string;
  smtpIngressIspconfigPassword: string;
  smtpIngressIspconfigInsecure: boolean;
}): IspconfigConfig | null {
  if (
    !settings.smtpIngressIspconfigUrl.trim()
    || !settings.smtpIngressIspconfigUser.trim()
    || !settings.smtpIngressIspconfigPassword
  ) {
    return null;
  }
  return {
    apiUrl: settings.smtpIngressIspconfigUrl,
    username: settings.smtpIngressIspconfigUser,
    password: settings.smtpIngressIspconfigPassword,
    insecure: settings.smtpIngressIspconfigInsecure,
  };
}

async function failIssuance(
  error: unknown,
  setErrorStatus = true,
): Promise<boolean> {
  const message = (error as Error).message || 'Certificate request failed';
  console.error('Let’s Encrypt issuance failed:', error);
  await updateTlsIssuanceState({
    status: setErrorStatus ? 'error' : undefined,
    error: message,
  });
  return false;
}
