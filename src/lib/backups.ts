import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import type { Readable, Writable } from 'node:stream';
import { rotateDumpArtifacts as rotateByPolicy } from '@/lib/backup-rotate';
import {
  DEFAULT_COMPOSE_PROJECT,
  DEFAULT_POSTGRES_DB,
  DEFAULT_POSTGRES_USER,
} from '@/lib/brand';

export const DUMP_NAME_RE = /^relayhorizon-[A-Za-z0-9._-]+\.dump$/;

export type BackupStamp = {
  kind: string;
  at: string;
  artifact: string;
  schemaVersion: string;
  hostname: string;
};

export type BackupArtifact = {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
  kind: 'dump';
};

export class BackupError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type PgBin = 'pg_dump' | 'pg_restore' | 'psql';
type PgTool =
  | { kind: 'host'; bin: PgBin }
  | { kind: 'docker'; project: string; service: string; bin: PgBin };

export function backupDir(
  env: Record<string, string | undefined> = process.env,
): string {
  return path.resolve(env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
}

export function staleAfterHours(
  env: Record<string, string | undefined> = process.env,
): number {
  const n = Number(env.BACKUP_STALE_AFTER_HOURS ?? 36);
  return Number.isFinite(n) && n > 0 ? n : 36;
}

export function assertSafeDumpName(name: string): string {
  const base = path.basename(name);
  if (base !== name || !DUMP_NAME_RE.test(base)) {
    throw new BackupError(
      'BACKUP_INVALID_NAME',
      'Dump name must look like relayhorizon-….dump',
      400,
    );
  }
  return base;
}

export async function ensureBackupDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readStamp(
  dir: string,
  fileName:
    | 'last-success.json'
    | 'last-import.json'
    | 'last-failure.json'
    | 'scheduler-heartbeat.json'
    | 'last-offsite.json',
): Promise<BackupStamp | null> {
  try {
    const raw = await fs.readFile(path.join(dir, fileName), 'utf8');
    const parsed = JSON.parse(raw) as Partial<BackupStamp>;
    if (!parsed.at || typeof parsed.at !== 'string') return null;
    return {
      kind: typeof parsed.kind === 'string' ? parsed.kind : fileName,
      at: parsed.at,
      artifact: typeof parsed.artifact === 'string' ? parsed.artifact : '',
      schemaVersion:
        typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : '',
      hostname: typeof parsed.hostname === 'string' ? parsed.hostname : '',
    };
  } catch {
    return null;
  }
}

export async function writeStamp(
  dir: string,
  fileName:
    | 'last-success.json'
    | 'last-import.json'
    | 'last-failure.json'
    | 'last-offsite.json',
  stamp: BackupStamp,
): Promise<void> {
  await ensureBackupDir(dir);
  await fs.writeFile(
    path.join(dir, fileName),
    `${JSON.stringify(stamp, null, 2)}\n`,
    'utf8',
  );
}

export function stampAgeSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 1000));
}

export async function listBackupArtifacts(
  dir: string,
  limit = 40,
): Promise<BackupArtifact[]> {
  await ensureBackupDir(dir);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const artifacts: BackupArtifact[] = [];
  for (const name of entries) {
    if (!DUMP_NAME_RE.test(name)) continue;
    try {
      const stat = await fs.stat(path.join(dir, name));
      if (!stat.isFile()) continue;
      artifacts.push({
        name,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        kind: 'dump',
      });
    } catch {
      // skip
    }
  }
  artifacts.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  return artifacts.slice(0, limit);
}

export function dumpFilePath(dir: string, name: string): string {
  return path.join(dir, assertSafeDumpName(name));
}

export async function deleteBackupArtifact(
  dir: string,
  name: string,
): Promise<void> {
  const safe = assertSafeDumpName(name);
  try {
    await fs.unlink(path.join(dir, safe));
  } catch (err) {
    const code = errnoCode(err);
    if (code === 'ENOENT') {
      throw new BackupError('BACKUP_NOT_FOUND', 'Artifact not found', 404);
    }
    throw err;
  }
}

export function parseDatabaseUrl(databaseUrl: string): {
  user: string;
  password: string;
  database: string;
  host: string;
  port: string;
} {
  try {
    const url = new URL(databaseUrl);
    return {
      user: decodeURIComponent(url.username || DEFAULT_POSTGRES_USER),
      password: decodeURIComponent(url.password || ''),
      database: decodeURIComponent(
        (url.pathname || `/${DEFAULT_POSTGRES_DB}`).replace(/^\//, '').split('?')[0]
        || DEFAULT_POSTGRES_DB,
      ),
      host: url.hostname || 'localhost',
      port: url.port || '5432',
    };
  } catch {
    return {
      user: DEFAULT_POSTGRES_USER,
      password: '',
      database: DEFAULT_POSTGRES_DB,
      host: 'localhost',
      port: '5432',
    };
  }
}

export function requireDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const url = env.DATABASE_URL?.trim();
  if (!url) {
    throw new BackupError(
      'BACKUP_NO_DATABASE',
      'DATABASE_URL is not configured',
      503,
    );
  }
  return url;
}

function artifactTimestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function stampTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function runCommand(
  command: string,
  args: string[],
  options: { env?: Record<string, string> } = {},
): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stderrChunks: Buffer[] = [];
    const stdoutChunks: Buffer[] = [];
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stderr: Buffer.concat(stderrChunks).toString('utf8').trim(),
        stdout: Buffer.concat(stdoutChunks).toString('utf8').trim(),
      });
    });
  });
}

async function which(bin: string): Promise<boolean> {
  const result = await runCommand('sh', ['-c', `command -v ${bin}`]);
  return result.code === 0;
}

async function resolvePgTool(bin: PgBin): Promise<PgTool | null> {
  if (await which(bin)) return { kind: 'host', bin };
  if (!(await which('docker'))) return null;
  const project = process.env.COMPOSE_PROJECT_NAME?.trim() || DEFAULT_COMPOSE_PROJECT;
  const service = process.env.BACKUP_DOCKER_POSTGRES_SERVICE?.trim() || 'postgres';
  const running = await runCommand('docker', [
    'compose', '-p', project, 'ps', '-q', service,
  ]);
  if (running.code !== 0 || !running.stdout.trim()) return null;
  const hasBin = await runCommand('docker', [
    'compose', '-p', project, 'exec', '-T', service, 'which', bin,
  ]);
  if (hasBin.code !== 0) return null;
  return { kind: 'docker', project, service, bin };
}

function toolsMissingMessage(bin: PgBin): string {
  return (
    `${bin} is not available. The production web image includes postgresql-client; `
    + 'for local dev keep Compose postgres up or install postgresql-client-16.'
  );
}

function connectionArgs(
  tool: PgTool,
  creds: { user: string; database: string; host: string; port: string },
): string[] {
  if (tool.kind === 'docker') {
    return ['-h', 'localhost', '-p', '5432', '-U', creds.user, '-d', creds.database];
  }
  return ['-h', creds.host, '-p', creds.port, '-U', creds.user, '-d', creds.database];
}

function spawnPg(
  tool: PgTool,
  args: string[],
  options: { env?: Record<string, string>; stdin?: 'pipe' | 'ignore' } = {},
): ChildProcess {
  const stdio: ['pipe' | 'ignore', 'pipe', 'pipe'] = [
    options.stdin ?? 'ignore',
    'pipe',
    'pipe',
  ];
  if (tool.kind === 'host') {
    return spawn(tool.bin, args, {
      env: { ...process.env, ...options.env },
      stdio,
    });
  }
  const dockerArgs = ['compose', '-p', tool.project, 'exec', '-T'];
  if (options.env?.PGPASSWORD) {
    dockerArgs.push('-e', `PGPASSWORD=${options.env.PGPASSWORD}`);
  }
  dockerArgs.push(tool.service, tool.bin, ...args);
  return spawn('docker', dockerArgs, { env: process.env, stdio });
}

function requireStdio(child: ChildProcess): {
  stdout: Readable;
  stderr: Readable;
  stdin: Writable | null;
} {
  if (!child.stdout || !child.stderr) {
    throw new Error('spawnPg expected piped stdout/stderr');
  }
  return { stdout: child.stdout, stderr: child.stderr, stdin: child.stdin };
}

async function runPgCommand(
  tool: PgTool,
  args: string[],
  env?: Record<string, string>,
): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawnPg(tool, args, { env, stdin: 'ignore' });
    const { stdout, stderr } = requireStdio(child);
    const stderrChunks: Buffer[] = [];
    const stdoutChunks: Buffer[] = [];
    stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stderr: Buffer.concat(stderrChunks).toString('utf8').trim(),
        stdout: Buffer.concat(stdoutChunks).toString('utf8').trim(),
      });
    });
  });
}

async function streamDumpCommand(
  tool: PgTool,
  args: string[],
  outPath: string,
  env?: Record<string, string>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawnPg(tool, args, { env, stdin: 'ignore' });
    const { stdout, stderr } = requireStdio(child);
    const out = createWriteStream(outPath);
    const stderrChunks: Buffer[] = [];
    stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      void fs.unlink(outPath).catch(() => undefined);
      reject(error);
    };
    child.on('error', (error) => fail(error));
    const pipelineDone = pipeline(stdout, out).catch((error: Error) => {
      fail(error);
    });
    child.on('close', (code) => {
      void pipelineDone.finally(() => {
        if (settled) return;
        if (code === 0) {
          settled = true;
          resolve();
          return;
        }
        fail(
          new BackupError(
            'BACKUP_EXPORT_FAILED',
            `${tool.bin} failed (exit ${code}): ${Buffer.concat(stderrChunks)
              .toString('utf8')
              .trim()
              .slice(0, 500)}`,
            500,
          ),
        );
      });
    });
  });
}

export async function exportDatabaseDump(input: {
  backupDir: string;
  databaseUrl: string;
}): Promise<{ artifact: BackupArtifact; stamp: BackupStamp }> {
  await ensureBackupDir(input.backupDir);
  const name = `relayhorizon-${artifactTimestamp()}.dump`;
  const outPath = path.join(input.backupDir, name);
  const creds = parseDatabaseUrl(input.databaseUrl);
  const tool = await resolvePgTool('pg_dump');
  if (!tool) {
    throw new BackupError('BACKUP_TOOLS_MISSING', toolsMissingMessage('pg_dump'), 503);
  }
  await streamDumpCommand(
    tool,
    [...connectionArgs(tool, creds), '-Fc', '--no-owner', '--no-acl'],
    outPath,
    { PGPASSWORD: creds.password },
  );
  const stat = await fs.stat(outPath);
  if (stat.size <= 0) {
    await fs.unlink(outPath).catch(() => undefined);
    throw new BackupError('BACKUP_EXPORT_FAILED', 'pg_dump produced an empty file', 500);
  }
  try {
    await fs.symlink(name, path.join(input.backupDir, 'latest.dump'));
  } catch {
    try {
      await fs.unlink(path.join(input.backupDir, 'latest.dump'));
      await fs.symlink(name, path.join(input.backupDir, 'latest.dump'));
    } catch {
      // optional
    }
  }
  const stamp: BackupStamp = {
    kind: 'backup',
    at: stampTimestamp(),
    artifact: name,
    schemaVersion: 'relayhorizon',
    hostname: process.env.HOSTNAME ?? 'web',
  };
  await writeStamp(input.backupDir, 'last-success.json', stamp);
  return {
    artifact: {
      name,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      kind: 'dump',
    },
    stamp,
  };
}

async function preflightRestore(
  tool: PgTool,
  dumpPath: string,
  creds: ReturnType<typeof parseDatabaseUrl>,
): Promise<void> {
  const list = await runPgCommand(
    tool,
    ['-l', dumpPath],
    { PGPASSWORD: creds.password },
  );
  if (tool.kind === 'docker') {
    // list from stdin for docker
  }
  const ping = await resolvePgTool('psql');
  if (ping) {
    const ready = await runPgCommand(
      ping,
      [...connectionArgs(ping, creds), '-Atqc', 'SELECT 1'],
      { PGPASSWORD: creds.password },
    );
    if (ready.code !== 0 || ready.stdout.trim() !== '1') {
      throw new BackupError(
        'BACKUP_IMPORT_FAILED',
        `Database is not reachable: ${ready.stderr.slice(0, 300)}`,
        503,
      );
    }
  }
  if (tool.kind === 'host' && list.code !== 0) {
    throw new BackupError(
      'BACKUP_IMPORT_FAILED',
      `Dump is not readable: ${list.stderr.slice(0, 400)}`,
      400,
    );
  }
}

export async function importDatabaseDump(input: {
  backupDir: string;
  databaseUrl: string;
  dumpPath: string;
  confirm: string;
}): Promise<BackupStamp> {
  if (input.confirm !== 'REPLACE') {
    throw new BackupError(
      'BACKUP_CONFIRM_REQUIRED',
      'Type REPLACE to replace this database',
      400,
    );
  }
  const resolved = path.resolve(input.dumpPath);
  const backupRoot = path.resolve(input.backupDir);
  if (!resolved.startsWith(`${backupRoot}${path.sep}`)) {
    throw new BackupError(
      'BACKUP_INVALID_PATH',
      'Import dump must live under BACKUP_DIR',
      400,
    );
  }

  const creds = parseDatabaseUrl(input.databaseUrl);
  const restoreTool = await resolvePgTool('pg_restore');
  const psqlTool = await resolvePgTool('psql');
  if (!restoreTool || !psqlTool) {
    throw new BackupError(
      'BACKUP_TOOLS_MISSING',
      toolsMissingMessage('pg_restore'),
      503,
    );
  }

  await preflightRestore(restoreTool, resolved, creds);

  await runPgCommand(
    psqlTool,
    [
      ...connectionArgs(psqlTool, creds),
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity '
        + 'WHERE datname = current_database() AND pid <> pg_backend_pid();',
    ],
    { PGPASSWORD: creds.password },
  );

  const wipe = await runPgCommand(
    psqlTool,
    [
      ...connectionArgs(psqlTool, creds),
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
    ],
    { PGPASSWORD: creds.password },
  );
  if (wipe.code !== 0) {
    throw new BackupError(
      'BACKUP_IMPORT_FAILED',
      `Could not wipe schema: ${wipe.stderr.slice(0, 400)}`,
      500,
    );
  }

  const restoreArgs = [
    ...connectionArgs(restoreTool, creds),
    '--no-owner',
    '--no-acl',
  ];

  let result: { code: number; stderr: string };
  if (restoreTool.kind === 'host') {
    result = await runCommand('pg_restore', [...restoreArgs, resolved], {
      env: { PGPASSWORD: creds.password },
    });
  } else {
    result = await new Promise((resolve, reject) => {
      const child = spawnPg(
        restoreTool,
        [...restoreArgs, '-Fc', '-'],
        { env: { PGPASSWORD: creds.password }, stdin: 'pipe' },
      );
      const { stdout, stderr, stdin } = requireStdio(child);
      if (!stdin) {
        reject(new Error('spawnPg expected piped stdin for restore'));
        return;
      }
      const stderrChunks: Buffer[] = [];
      stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
      stdout.resume();
      child.on('error', reject);
      createReadStream(resolved).pipe(stdin);
      child.on('close', (code) => {
        resolve({
          code: code ?? 1,
          stderr: Buffer.concat(stderrChunks).toString('utf8').trim(),
        });
      });
    });
  }

  if (result.code !== 0 && result.code !== 1) {
    throw new BackupError(
      'BACKUP_IMPORT_FAILED',
      `pg_restore failed (exit ${result.code}): ${result.stderr.slice(0, 500)}`,
      500,
    );
  }
  if (/cannot drop|already exists/i.test(result.stderr)) {
    throw new BackupError(
      'BACKUP_IMPORT_FAILED',
      `pg_restore reported object conflicts: ${result.stderr.slice(0, 500)}`,
      500,
    );
  }

  const stamp: BackupStamp = {
    kind: 'import',
    at: stampTimestamp(),
    artifact: path.basename(resolved),
    schemaVersion: 'relayhorizon',
    hostname: process.env.HOSTNAME ?? 'web',
  };
  await writeStamp(input.backupDir, 'last-import.json', stamp);
  return stamp;
}

export async function saveUploadedDump(
  dir: string,
  buffer: Buffer,
  suggestedName?: string,
): Promise<string> {
  await ensureBackupDir(dir);
  const name =
    suggestedName && DUMP_NAME_RE.test(path.basename(suggestedName))
      ? path.basename(suggestedName)
      : `relayhorizon-upload-${artifactTimestamp()}.dump`;
  await fs.writeFile(path.join(dir, name), buffer);
  return name;
}

export async function rotateDumpArtifacts(
  dir: string,
  policy: { keepDaily: number; keepWeekly: number; keepMonthly: number },
) {
  return rotateByPolicy(dir, policy, DUMP_NAME_RE);
}

function errnoCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
