import { query } from '@/lib/database';
import {
  listenPortsFromStored,
  parseTlsMode,
  serializeListenPorts,
  type SmtpIngressTlsMode,
} from '@/lib/smtp-ingress';
import {
  computeRenewAt,
  isoDate,
  isPublicTlsHostname,
  parseTlsHostname,
  parseTlsSource,
  parseTlsStatus,
  readCertificateExpiry,
  type SmtpIngressTlsSource,
  type SmtpIngressTlsStatus,
} from '@/lib/smtp-tls';

export const SECRET_MASK = '********';

export type PlatformSettingsRow = {
  id: string;
  ses_region: string | null;
  ses_access_key_id: string | null;
  ses_secret_access_key: string | null;
  ses_configuration_set: string | null;
  smtp_enabled: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean;
  smtp_username: string | null;
  smtp_password: string | null;
  alert_email: string | null;
  alert_from: string | null;
  smtp_listen_ports?: string | null;
  smtp_ingress_tls_mode?: string | null;
  smtp_ingress_tls_cert?: string | null;
  smtp_ingress_tls_key?: string | null;
  smtp_ingress_tls_source?: string | null;
  smtp_ingress_tls_domain?: string | null;
  smtp_ingress_acme_account_key?: string | null;
  smtp_ingress_tls_expires_at?: Date | string | null;
  smtp_ingress_tls_renew_at?: Date | string | null;
  smtp_ingress_tls_status?: string | null;
  smtp_ingress_tls_error?: string | null;
  smtp_ingress_tls_status_at?: Date | string | null;
  smtp_ingress_acme_http_token?: string | null;
  smtp_ingress_acme_http_key_auth?: string | null;
};

export type ResolvedPlatformSettings = {
  sesRegion: string;
  sesAccessKeyId: string;
  sesSecretAccessKey: string;
  sesConfigurationSet: string;
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  alertEmail: string;
  alertFrom: string;
  smtpListenPorts: number[];
  smtpIngressTlsMode: SmtpIngressTlsMode;
  smtpIngressTlsCert: string;
  smtpIngressTlsKey: string;
  smtpIngressTlsSource: SmtpIngressTlsSource;
  smtpIngressTlsDomain: string;
  smtpIngressAcmeAccountKey: string;
  smtpIngressTlsExpiresAt: string;
  smtpIngressTlsRenewAt: string;
  smtpIngressTlsStatus: SmtpIngressTlsStatus;
  smtpIngressTlsError: string;
  smtpIngressTlsStatusAt: string;
  smtpIngressAcmeHttpToken: string;
  smtpIngressAcmeHttpKeyAuth: string;
};

export type PlatformSettingsPatch = {
  sesRegion?: string;
  sesAccessKeyId?: string;
  sesSecretAccessKey?: string;
  sesConfigurationSet?: string;
  smtpEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  alertEmail?: string;
  alertFrom?: string;
  smtpListenPorts?: number[];
  smtpIngressTlsMode?: SmtpIngressTlsMode;
  smtpIngressTlsCert?: string;
  smtpIngressTlsKey?: string;
  smtpIngressTlsSource?: SmtpIngressTlsSource;
  smtpIngressTlsDomain?: string;
};

export type PublicPlatformSettings = {
  sesRegion: string;
  sesAccessKeyConfigured: boolean;
  sesSecretConfigured: boolean;
  sesConfigurationSet: string;
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPasswordConfigured: boolean;
  alertEmail: string;
  alertFrom: string;
  smtpListenPorts: number[];
  smtpIngressTlsMode: SmtpIngressTlsMode;
  smtpIngressTlsConfigured: boolean;
  smtpIngressTlsSource: SmtpIngressTlsSource;
  smtpIngressTlsDomain: string;
  smtpIngressTlsStatus: SmtpIngressTlsStatus;
  smtpIngressTlsError: string;
  smtpIngressTlsExpiresAt: string;
  smtpIngressTlsRenewAt: string;
};

type EnvSource = Record<string, string | undefined>;

function blank(value: string | null | undefined): string {
  return (value || '').trim();
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const next = blank(value);
    if (next) return next;
  }
  return '';
}

export function resolvePlatformSettings(
  row: Partial<PlatformSettingsRow> | null,
  env: EnvSource = process.env,
): ResolvedPlatformSettings {
  const smtpHost = firstNonEmpty(row?.smtp_host, env.PLATFORM_SMTP_HOST);
  const smtpEnabled =
    typeof row?.smtp_enabled === 'boolean'
      ? row.smtp_enabled
      : Boolean(smtpHost);

  return {
    sesRegion: firstNonEmpty(row?.ses_region, env.AWS_REGION, 'us-east-1'),
    sesAccessKeyId: firstNonEmpty(
      row?.ses_access_key_id,
      env.AWS_ACCESS_KEY_ID,
    ),
    sesSecretAccessKey: firstNonEmpty(
      row?.ses_secret_access_key,
      env.AWS_SECRET_ACCESS_KEY,
    ),
    sesConfigurationSet: firstNonEmpty(
      row?.ses_configuration_set,
      env.SES_CONFIGURATION_SET,
      'outpost-prod',
    ),
    smtpEnabled,
    smtpHost,
    smtpPort: row?.smtp_port || Number(env.PLATFORM_SMTP_PORT || 587),
    smtpSecure:
      typeof row?.smtp_secure === 'boolean'
        ? row.smtp_secure
        : env.PLATFORM_SMTP_SECURE !== 'false',
    smtpUsername: firstNonEmpty(row?.smtp_username, env.PLATFORM_SMTP_USERNAME),
    smtpPassword: firstNonEmpty(row?.smtp_password, env.PLATFORM_SMTP_PASSWORD),
    alertEmail: firstNonEmpty(row?.alert_email, env.ALERT_EMAIL, env.ADMIN_EMAIL),
    alertFrom: firstNonEmpty(
      row?.alert_from,
      env.ALERT_FROM,
      env.FROM_EMAIL,
    ),
    smtpListenPorts: listenPortsFromStored(row?.smtp_listen_ports, env),
    smtpIngressTlsMode: parseTlsMode(
      firstNonEmpty(row?.smtp_ingress_tls_mode, env.SMTP_TLS_MODE, 'off'),
    ),
    smtpIngressTlsCert: firstNonEmpty(
      row?.smtp_ingress_tls_cert,
      env.SMTP_TLS_CERT,
    ),
    smtpIngressTlsKey: firstNonEmpty(
      row?.smtp_ingress_tls_key,
      env.SMTP_TLS_KEY,
    ),
    smtpIngressTlsSource: parseTlsSource(
      firstNonEmpty(row?.smtp_ingress_tls_source, env.SMTP_TLS_SOURCE),
    ),
    smtpIngressTlsDomain: resolveTlsDomain(row?.smtp_ingress_tls_domain, env),
    smtpIngressAcmeAccountKey: blank(row?.smtp_ingress_acme_account_key),
    smtpIngressTlsExpiresAt: isoDate(row?.smtp_ingress_tls_expires_at),
    smtpIngressTlsRenewAt: isoDate(row?.smtp_ingress_tls_renew_at),
    smtpIngressTlsStatus: parseTlsStatus(row?.smtp_ingress_tls_status),
    smtpIngressTlsError: blank(row?.smtp_ingress_tls_error),
    smtpIngressTlsStatusAt: isoDate(row?.smtp_ingress_tls_status_at),
    smtpIngressAcmeHttpToken: blank(row?.smtp_ingress_acme_http_token),
    smtpIngressAcmeHttpKeyAuth: blank(row?.smtp_ingress_acme_http_key_auth),
  };
}

function resolveTlsDomain(
  stored: string | null | undefined,
  env: EnvSource,
): string {
  const fromRow = parseTlsHostname(stored);
  if (fromRow) return fromRow;
  const fromEnv = parseTlsHostname(
    firstNonEmpty(env.SMTP_TLS_DOMAIN, env.SMTP_PUBLIC_HOST),
  );
  return isPublicTlsHostname(fromEnv) ? fromEnv : '';
}

export function toPublicPlatformSettings(
  resolved: ResolvedPlatformSettings,
): PublicPlatformSettings {
  return {
    sesRegion: resolved.sesRegion,
    sesAccessKeyConfigured: Boolean(resolved.sesAccessKeyId),
    sesSecretConfigured: Boolean(resolved.sesSecretAccessKey),
    sesConfigurationSet: resolved.sesConfigurationSet,
    smtpEnabled: resolved.smtpEnabled,
    smtpHost: resolved.smtpHost,
    smtpPort: resolved.smtpPort,
    smtpSecure: resolved.smtpSecure,
    smtpUsername: resolved.smtpUsername,
    smtpPasswordConfigured: Boolean(resolved.smtpPassword),
    alertEmail: resolved.alertEmail,
    alertFrom: resolved.alertFrom,
    smtpListenPorts: resolved.smtpListenPorts,
    smtpIngressTlsMode: resolved.smtpIngressTlsMode,
    smtpIngressTlsConfigured: Boolean(
      resolved.smtpIngressTlsCert && resolved.smtpIngressTlsKey,
    ),
    smtpIngressTlsSource: resolved.smtpIngressTlsSource,
    smtpIngressTlsDomain: resolved.smtpIngressTlsDomain,
    smtpIngressTlsStatus: resolved.smtpIngressTlsStatus,
    smtpIngressTlsError: resolved.smtpIngressTlsError,
    smtpIngressTlsExpiresAt: resolved.smtpIngressTlsExpiresAt,
    smtpIngressTlsRenewAt: resolved.smtpIngressTlsRenewAt,
  };
}

export function keepSecret(
  incoming: string | undefined,
  current: string | null | undefined,
): string | null {
  if (incoming === undefined || isMaskedSecret(incoming)) {
    return current || null;
  }
  return blank(incoming) || null;
}

function keepText(
  incoming: string | undefined,
  current: string | null | undefined,
): string | null {
  if (incoming === undefined) return current || null;
  return blank(incoming) || null;
}

function isMaskedSecret(value: string | undefined): boolean {
  return !value || value === SECRET_MASK || value === '••••••••';
}

export async function getPlatformSettingsRow(): Promise<PlatformSettingsRow | null> {
  try {
    const result = await query(
      `SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1`,
    );
    return (result.rows[0] as PlatformSettingsRow) || null;
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === '42P01') {
      console.warn(
        'platform_settings table is missing; using environment fallbacks',
      );
      return null;
    }
    throw error;
  }
}

export async function getResolvedPlatformSettings(): Promise<ResolvedPlatformSettings> {
  const row = await getPlatformSettingsRow();
  return resolvePlatformSettings(row);
}

export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  return toPublicPlatformSettings(await getResolvedPlatformSettings());
}

export async function hasSesCredentials(): Promise<boolean> {
  const settings = await getResolvedPlatformSettings();
  return Boolean(settings.sesAccessKeyId && settings.sesSecretAccessKey);
}

export async function updatePlatformSettings(
  patch: PlatformSettingsPatch,
): Promise<ResolvedPlatformSettings> {
  const current = await getPlatformSettingsRow();

  await query(
    `INSERT INTO platform_settings (
      id, ses_region, ses_access_key_id, ses_secret_access_key,
      ses_configuration_set, smtp_enabled, smtp_host, smtp_port, smtp_secure,
      smtp_username, smtp_password, alert_email, alert_from,
      smtp_listen_ports, smtp_ingress_tls_mode, smtp_ingress_tls_cert,
      smtp_ingress_tls_key, smtp_ingress_tls_source, smtp_ingress_tls_domain
    ) VALUES (
      'default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18
    )
    ON CONFLICT (id) DO UPDATE SET
      ses_region = EXCLUDED.ses_region,
      ses_access_key_id = EXCLUDED.ses_access_key_id,
      ses_secret_access_key = EXCLUDED.ses_secret_access_key,
      ses_configuration_set = EXCLUDED.ses_configuration_set,
      smtp_enabled = EXCLUDED.smtp_enabled,
      smtp_host = EXCLUDED.smtp_host,
      smtp_port = EXCLUDED.smtp_port,
      smtp_secure = EXCLUDED.smtp_secure,
      smtp_username = EXCLUDED.smtp_username,
      smtp_password = EXCLUDED.smtp_password,
      alert_email = EXCLUDED.alert_email,
      alert_from = EXCLUDED.alert_from,
      smtp_listen_ports = EXCLUDED.smtp_listen_ports,
      smtp_ingress_tls_mode = EXCLUDED.smtp_ingress_tls_mode,
      smtp_ingress_tls_cert = EXCLUDED.smtp_ingress_tls_cert,
      smtp_ingress_tls_key = EXCLUDED.smtp_ingress_tls_key,
      smtp_ingress_tls_source = EXCLUDED.smtp_ingress_tls_source,
      smtp_ingress_tls_domain = EXCLUDED.smtp_ingress_tls_domain`,
    [
      keepText(patch.sesRegion, current?.ses_region),
      keepSecret(patch.sesAccessKeyId, current?.ses_access_key_id),
      keepSecret(patch.sesSecretAccessKey, current?.ses_secret_access_key),
      keepText(patch.sesConfigurationSet, current?.ses_configuration_set),
      patch.smtpEnabled !== undefined
        ? Boolean(patch.smtpEnabled)
        : Boolean(current?.smtp_enabled),
      keepText(patch.smtpHost, current?.smtp_host),
      patch.smtpPort !== undefined
        ? patch.smtpPort || null
        : current?.smtp_port || null,
      patch.smtpSecure !== undefined
        ? patch.smtpSecure !== false
        : current?.smtp_secure !== false,
      keepText(patch.smtpUsername, current?.smtp_username),
      keepSecret(patch.smtpPassword, current?.smtp_password),
      keepText(patch.alertEmail, current?.alert_email),
      keepText(patch.alertFrom, current?.alert_from),
      patch.smtpListenPorts !== undefined
        ? serializeListenPorts(patch.smtpListenPorts)
        : current?.smtp_listen_ports || null,
      patch.smtpIngressTlsMode
        || parseTlsMode(current?.smtp_ingress_tls_mode),
      keepSecret(patch.smtpIngressTlsCert, current?.smtp_ingress_tls_cert),
      keepSecret(patch.smtpIngressTlsKey, current?.smtp_ingress_tls_key),
      patch.smtpIngressTlsSource
        || parseTlsSource(current?.smtp_ingress_tls_source),
      patch.smtpIngressTlsDomain !== undefined
        ? parseTlsHostname(patch.smtpIngressTlsDomain) || null
        : current?.smtp_ingress_tls_domain || null,
    ],
  );

  const resolved = await getResolvedPlatformSettings();
  if (
    resolved.smtpIngressTlsSource === 'manual'
    && patch.smtpIngressTlsCert
    && !isMaskedSecret(patch.smtpIngressTlsCert)
  ) {
    const expiresAt = readCertificateExpiry(resolved.smtpIngressTlsCert);
    await updateTlsIssuanceState({
      status: resolved.smtpIngressTlsCert && resolved.smtpIngressTlsKey
        ? 'issued'
        : 'idle',
      error: null,
      expiresAt: expiresAt || null,
      renewAt: null,
    });
    return getResolvedPlatformSettings();
  }

  return resolved;
}

export type TlsIssuancePatch = {
  status?: SmtpIngressTlsStatus;
  error?: string | null;
  cert?: string | null;
  key?: string | null;
  expiresAt?: Date | string | null;
  renewAt?: Date | string | null;
  accountKey?: string | null;
  httpToken?: string | null;
  httpKeyAuth?: string | null;
};

export async function updateTlsIssuanceState(
  patch: TlsIssuancePatch,
): Promise<void> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const set = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (patch.status !== undefined) {
    set('smtp_ingress_tls_status', patch.status);
    set('smtp_ingress_tls_status_at', new Date());
  }
  if (patch.error !== undefined) set('smtp_ingress_tls_error', patch.error);
  if (patch.cert !== undefined) set('smtp_ingress_tls_cert', patch.cert);
  if (patch.key !== undefined) set('smtp_ingress_tls_key', patch.key);
  if (patch.expiresAt !== undefined) {
    set('smtp_ingress_tls_expires_at', patch.expiresAt || null);
  }
  if (patch.renewAt !== undefined) {
    set('smtp_ingress_tls_renew_at', patch.renewAt || null);
  }
  if (patch.accountKey !== undefined) {
    set('smtp_ingress_acme_account_key', patch.accountKey);
  }
  if (patch.httpToken !== undefined) {
    set('smtp_ingress_acme_http_token', patch.httpToken);
  }
  if (patch.httpKeyAuth !== undefined) {
    set('smtp_ingress_acme_http_key_auth', patch.httpKeyAuth);
  }

  if (assignments.length === 0) return;

  values.push('default');
  await query(
    `UPDATE platform_settings SET ${assignments.join(', ')} WHERE id = $${values.length}`,
    values,
  );
}

export async function getAcmeHttpChallenge(
  token: string,
): Promise<string | null> {
  const live = liveHttpChallenges.get(token);
  if (live) return live;
  const result = await query(
    `SELECT smtp_ingress_acme_http_key_auth AS key_auth
     FROM platform_settings
     WHERE id = 'default' AND smtp_ingress_acme_http_token = $1
     LIMIT 1`,
    [token],
  );
  return (result.rows[0] as { key_auth?: string } | undefined)?.key_auth || null;
}

const liveHttpChallenges = new Map<string, string>();

export function rememberAcmeHttpChallenge(
  token: string,
  keyAuthorization: string,
): void {
  liveHttpChallenges.set(token, keyAuthorization);
}

export function forgetAcmeHttpChallenge(token: string): void {
  liveHttpChallenges.delete(token);
}

export function renewAtFromExpiry(expiresAt: Date | string): Date {
  return computeRenewAt(
    expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
  );
}
