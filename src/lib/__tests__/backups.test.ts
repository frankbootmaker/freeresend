/**
 * @jest-environment node
 */

import { mkdtemp, writeFile, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  assertSafeDumpName,
  BackupError,
  importDatabaseDump,
} from '../backups';
import { rotateDumpArtifacts } from '../backup-rotate';
import { offsiteObjectKey, resolveOffsiteSettings } from '../backup-offsite';

describe('assertSafeDumpName', () => {
  it('accepts relayhorizon dumps', () => {
    expect(assertSafeDumpName('relayhorizon-20260101T000000Z.dump'))
      .toBe('relayhorizon-20260101T000000Z.dump');
  });

  it('rejects path traversal and other prefixes', () => {
    expect(() => assertSafeDumpName('../secret.dump')).toThrow(BackupError);
    expect(() => assertSafeDumpName('amae-x.dump')).toThrow(BackupError);
  });
});

describe('importDatabaseDump', () => {
  it('refuses without REPLACE', async () => {
    await expect(
      importDatabaseDump({
        backupDir: '/tmp',
        databaseUrl: 'postgresql://u:p@localhost/db',
        dumpPath: '/tmp/relayhorizon-x.dump',
        confirm: 'yes',
      }),
    ).rejects.toMatchObject({
      code: 'BACKUP_CONFIRM_REQUIRED',
      status: 400,
    });
  });
});

describe('rotateDumpArtifacts', () => {
  it('keeps recent dumps and deletes old ones', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'rh-bak-'));
    const nameRe = /^relayhorizon-[A-Za-z0-9._-]+\.dump$/;
    const now = Date.now();
    await writeFile(path.join(dir, 'relayhorizon-new.dump'), 'x');
    await writeFile(path.join(dir, 'relayhorizon-old.dump'), 'y');
    const old = (now - 40 * 86_400_000) / 1000;
    await utimes(path.join(dir, 'relayhorizon-old.dump'), old, old);
    const result = await rotateDumpArtifacts(
      dir,
      { keepDaily: 7, keepWeekly: 0, keepMonthly: 0 },
      nameRe,
    );
    expect(result.kept).toBe(1);
    expect(result.deleted).toContain('relayhorizon-old.dump');
  });
});

describe('offsite helpers', () => {
  it('builds a prefixed object key', () => {
    expect(
      offsiteObjectKey(
        {
          enabled: true,
          endpoint: '',
          region: 'auto',
          bucket: 'ops',
          prefix: 'backups',
          accessKeyId: '',
          secretAccessKey: '',
          forcePathStyle: true,
        },
        'relayhorizon-a.dump',
      ),
    ).toBe('backups/relayhorizon-a.dump');
  });

  it('falls back to env when the row is empty', () => {
    const settings = resolveOffsiteSettings(null, {
      BACKUP_S3_ENABLED: 'true',
      BACKUP_S3_BUCKET: 'ops',
      BACKUP_S3_ENDPOINT: 'https://s3.example',
    });
    expect(settings.enabled).toBe(true);
    expect(settings.bucket).toBe('ops');
    expect(settings.endpoint).toBe('https://s3.example');
  });
});
