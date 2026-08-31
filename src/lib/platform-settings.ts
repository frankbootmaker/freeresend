import { query } from '@/lib/database';
import {
  listenPortsFromStored,
  parseTlsMode,
  serializeListenPorts,
  type SmtpIngressTlsMode,
} from '@/lib/smtp-ingress';

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
  };
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
      smtp_ingress_tls_key
    ) VALUES (
      'default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16
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
      smtp_ingress_tls_key = EXCLUDED.smtp_ingress_tls_key`,
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
    ],
  );

  return getResolvedPlatformSettings();
}
