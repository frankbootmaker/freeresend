import { promises as fs } from 'node:fs';
import path from 'node:path';

export type RotateResult = { kept: number; deleted: string[] };

export async function rotateDumpArtifacts(
  dir: string,
  policy: { keepDaily: number; keepWeekly: number; keepMonthly: number },
  nameRe: RegExp,
): Promise<RotateResult> {
  await fs.mkdir(dir, { recursive: true });
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return { kept: 0, deleted: [] };
  }

  type Entry = { name: string; full: string; mtimeMs: number };
  const files: Entry[] = [];
  for (const name of entries) {
    if (!nameRe.test(name)) continue;
    const full = path.join(dir, name);
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile()) continue;
      files.push({ name, full, mtimeMs: stat.mtimeMs });
    } catch {
      // skip
    }
  }

  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const now = Date.now();
  const keep = new Set<string>();
  const seenWeek = new Set<string>();
  const seenMonth = new Set<string>();
  let weeklyCount = 0;
  let monthlyCount = 0;

  for (const file of files) {
    const ageDays = Math.floor((now - file.mtimeMs) / 86_400_000);
    const date = new Date(file.mtimeMs);
    const weekKey = isoWeekKey(date);
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

    if (ageDays < policy.keepDaily) {
      keep.add(file.name);
      continue;
    }

    const weeklyHorizon = policy.keepDaily + 7 * policy.keepWeekly;
    if (ageDays < weeklyHorizon) {
      if (!seenWeek.has(weekKey) && weeklyCount < policy.keepWeekly) {
        keep.add(file.name);
        seenWeek.add(weekKey);
        weeklyCount += 1;
      }
      continue;
    }

    const monthlyHorizon = weeklyHorizon + 31 * policy.keepMonthly;
    if (ageDays < monthlyHorizon) {
      if (!seenMonth.has(monthKey) && monthlyCount < policy.keepMonthly) {
        keep.add(file.name);
        seenMonth.add(monthKey);
        monthlyCount += 1;
      }
    }
  }

  const deleted: string[] = [];
  for (const file of files) {
    if (keep.has(file.name)) continue;
    await fs.unlink(file.full).catch(() => undefined);
    deleted.push(file.name);
  }

  return { kept: keep.size, deleted };
}

function isoWeekKey(date: Date): string {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
