import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { query } from '@/lib/database';
import { keepSecret, SECRET_MASK } from '@/lib/platform-settings';
import {
  assertSafeDumpName,
  backupDir,
  type BackupStamp,
  listBackupArtifacts,
  writeStamp,
} from '@/lib/backups';

export type OffsiteSettings = {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type PublicOffsiteSettings = {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyConfigured: boolean;
  secretConfigured: boolean;
  forcePathStyle: boolean;
};

const UPLOADED_FILE = 'offsite-uploaded.json';

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

export function resolveOffsiteSettings(
  row: Partial<{
    backup_s3_enabled?: boolean | null;
    backup_s3_endpoint?: string | null;
    backup_s3_region?: string | null;
    backup_s3_bucket?: string | null;
    backup_s3_prefix?: string | null;
    backup_s3_access_key_id?: string | null;
    backup_s3_secret_access_key?: string | null;
    backup_s3_force_path_style?: boolean | null;
  }> | null,
  env: Record<string, string | undefined> = process.env,
): OffsiteSettings {
  const enabled =
    typeof row?.backup_s3_enabled === 'boolean'
      ? row.backup_s3_enabled
      : env.BACKUP_S3_ENABLED === 'true' || env.BACKUP_S3_ENABLED === '1';
  return {
    enabled,
    endpoint: firstNonEmpty(row?.backup_s3_endpoint, env.BACKUP_S3_ENDPOINT),
    region: firstNonEmpty(row?.backup_s3_region, env.BACKUP_S3_REGION, 'auto'),
    bucket: firstNonEmpty(row?.backup_s3_bucket, env.BACKUP_S3_BUCKET),
    prefix: firstNonEmpty(row?.backup_s3_prefix, env.BACKUP_S3_PREFIX, 'backups/'),
    accessKeyId: firstNonEmpty(
      row?.backup_s3_access_key_id,
      env.BACKUP_S3_ACCESS_KEY_ID,
    ),
    secretAccessKey: firstNonEmpty(
      row?.backup_s3_secret_access_key,
      env.BACKUP_S3_SECRET_ACCESS_KEY,
    ),
    forcePathStyle:
      typeof row?.backup_s3_force_path_style === 'boolean'
        ? row.backup_s3_force_path_style
        : env.BACKUP_S3_FORCE_PATH_STYLE !== 'false',
  };
}

export function toPublicOffsite(settings: OffsiteSettings): PublicOffsiteSettings {
  return {
    enabled: settings.enabled,
    endpoint: settings.endpoint,
    region: settings.region,
    bucket: settings.bucket,
    prefix: settings.prefix,
    accessKeyConfigured: Boolean(settings.accessKeyId),
    secretConfigured: Boolean(settings.secretAccessKey),
    forcePathStyle: settings.forcePathStyle,
  };
}

async function loadS3() {
  return import('@aws-sdk/client-s3');
}

export async function createOffsiteClient(settings: OffsiteSettings) {
  const { S3Client } = await loadS3();
  return new S3Client({
    region: settings.region || 'auto',
    endpoint: settings.endpoint || undefined,
    forcePathStyle: settings.forcePathStyle,
    credentials: settings.accessKeyId
      ? {
          accessKeyId: settings.accessKeyId,
          secretAccessKey: settings.secretAccessKey,
        }
      : undefined,
  });
}

export function offsiteObjectKey(settings: OffsiteSettings, name: string): string {
  const prefix = settings.prefix.replace(/^\/+/, '');
  const withSlash = prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix;
  return `${withSlash}${name}`;
}

export async function getOffsiteSettings(): Promise<OffsiteSettings> {
  try {
    const result = await query(
      `SELECT backup_s3_enabled, backup_s3_endpoint, backup_s3_region,
              backup_s3_bucket, backup_s3_prefix, backup_s3_access_key_id,
              backup_s3_secret_access_key, backup_s3_force_path_style
       FROM platform_settings WHERE id = 'default' LIMIT 1`,
    );
    return resolveOffsiteSettings(result.rows[0] || null);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === '42703' || err.code === '42P01') {
      return resolveOffsiteSettings(null);
    }
    throw error;
  }
}

export async function updateOffsiteSettings(patch: {
  enabled?: boolean;
  endpoint?: string;
  region?: string;
  bucket?: string;
  prefix?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}): Promise<OffsiteSettings> {
  const current = await getOffsiteSettings();
  const next: OffsiteSettings = {
    enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
    endpoint: patch.endpoint !== undefined ? blank(patch.endpoint) : current.endpoint,
    region: patch.region !== undefined ? blank(patch.region) || 'auto' : current.region,
    bucket: patch.bucket !== undefined ? blank(patch.bucket) : current.bucket,
    prefix: patch.prefix !== undefined
      ? blank(patch.prefix) || 'backups/'
      : current.prefix,
    accessKeyId: keepSecret(patch.accessKeyId, current.accessKeyId) || '',
    secretAccessKey: keepSecret(patch.secretAccessKey, current.secretAccessKey) || '',
    forcePathStyle:
      patch.forcePathStyle !== undefined
        ? Boolean(patch.forcePathStyle)
        : current.forcePathStyle,
  };
  await query(
    `UPDATE platform_settings SET
      backup_s3_enabled = $1,
      backup_s3_endpoint = $2,
      backup_s3_region = $3,
      backup_s3_bucket = $4,
      backup_s3_prefix = $5,
      backup_s3_access_key_id = $6,
      backup_s3_secret_access_key = $7,
      backup_s3_force_path_style = $8
     WHERE id = 'default'`,
    [
      next.enabled,
      next.endpoint || null,
      next.region || null,
      next.bucket || null,
      next.prefix || null,
      next.accessKeyId || null,
      next.secretAccessKey || null,
      next.forcePathStyle,
    ],
  );
  return next;
}

export async function testOffsiteConnection(
  settings?: OffsiteSettings,
): Promise<{ ok: boolean; error?: string }> {
  const resolved = settings || (await getOffsiteSettings());
  if (!resolved.bucket) {
    return { ok: false, error: 'Bucket is required' };
  }
  try {
    const { HeadBucketCommand } = await loadS3();
    const client = await createOffsiteClient(resolved);
    await client.send(new HeadBucketCommand({ Bucket: resolved.bucket }));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message || 'S3 connection failed',
    };
  }
}

async function readUploaded(dir: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(dir, UPLOADED_FILE), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

async function writeUploaded(dir: string, names: string[]): Promise<void> {
  await fs.writeFile(
    path.join(dir, UPLOADED_FILE),
    `${JSON.stringify(names, null, 2)}\n`,
    'utf8',
  );
}

export async function pushDumpOffsite(input: {
  dir?: string;
  name?: string;
  settings?: OffsiteSettings;
}): Promise<{ name: string; key: string; stamp: BackupStamp }> {
  const dir = input.dir || backupDir();
  const settings = input.settings || (await getOffsiteSettings());
  if (!settings.enabled) {
    throw new Error('Offsite upload is disabled');
  }
  if (!settings.bucket) {
    throw new Error('S3 bucket is not configured');
  }
  let name = input.name;
  if (!name) {
    const artifacts = await listBackupArtifacts(dir, 1);
    name = artifacts[0]?.name;
  }
  if (!name) throw new Error('No dump available to push');
  const safe = assertSafeDumpName(name);
  const key = offsiteObjectKey(settings, safe);
  const { PutObjectCommand } = await loadS3();
  const client = await createOffsiteClient(settings);
  const body = createReadStream(path.join(dir, safe));
  await client.send(
    new PutObjectCommand({
      Bucket: settings.bucket,
      Key: key,
      Body: body,
    }),
  );
  const stamp: BackupStamp = {
    kind: 'offsite',
    at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    artifact: safe,
    schemaVersion: 'relayhorizon',
    hostname: process.env.HOSTNAME ?? 'web',
  };
  await writeStamp(dir, 'last-offsite.json', stamp);
  const uploaded = await readUploaded(dir);
  if (!uploaded.includes(safe)) {
    uploaded.push(safe);
    await writeUploaded(dir, uploaded);
  }
  return { name: safe, key, stamp };
}

export async function pushPendingDumps(): Promise<{
  pushed: string[];
  skipped: boolean;
  error?: string;
}> {
  const settings = await getOffsiteSettings();
  if (!settings.enabled || !settings.bucket) {
    return { pushed: [], skipped: true };
  }
  const dir = backupDir();
  const artifacts = await listBackupArtifacts(dir, 40);
  const uploaded = new Set(await readUploaded(dir));
  const pushed: string[] = [];
  try {
    for (const artifact of artifacts) {
      if (uploaded.has(artifact.name)) continue;
      await pushDumpOffsite({ dir, name: artifact.name, settings });
      pushed.push(artifact.name);
    }
    return { pushed, skipped: false };
  } catch (error) {
    return {
      pushed,
      skipped: false,
      error: (error as Error).message,
    };
  }
}

export { SECRET_MASK };
