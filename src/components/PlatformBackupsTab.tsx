'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';
import { SCHEDULE_INTERVAL_PRESETS } from '@/lib/backup-constants';

type Stamp = {
  kind: string;
  at: string;
  artifact: string;
} | null;

type Artifact = {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
};

type BackupStatus = {
  artifacts: Artifact[];
  lastSuccess: Stamp;
  lastSuccessAgeSeconds: number | null;
  lastImport: Stamp;
  lastFailure: Stamp;
  heartbeat: Stamp;
  lastOffsite: Stamp;
  stale: boolean;
  schedule: { enabled: boolean; intervalSeconds: number };
  retention: {
    keepDaily: number;
    keepWeekly: number;
    keepMonthly: number;
    autoRotate: boolean;
  };
  offsite: {
    enabled: boolean;
    endpoint: string;
    region: string;
    bucket: string;
    prefix: string;
    accessKeyConfigured: boolean;
    secretConfigured: boolean;
    forcePathStyle: boolean;
  };
};

const INTERVAL_LABEL: Record<number, string> = {
  3600: '1h',
  21600: '6h',
  43200: '12h',
  86400: '24h',
  604800: '7d',
};

export default function PlatformBackupsTab() {
  const { t, locale } = usePrefs();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(86400);
  const [keepDaily, setKeepDaily] = useState('7');
  const [keepWeekly, setKeepWeekly] = useState('4');
  const [keepMonthly, setKeepMonthly] = useState('3');
  const [autoRotate, setAutoRotate] = useState(true);
  const [s3Enabled, setS3Enabled] = useState(false);
  const [s3Endpoint, setS3Endpoint] = useState('');
  const [s3Region, setS3Region] = useState('auto');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Prefix, setS3Prefix] = useState('backups/');
  const [s3Key, setS3Key] = useState('');
  const [s3Secret, setS3Secret] = useState('');
  const [s3PathStyle, setS3PathStyle] = useState(true);

  const applyStatus = (next: BackupStatus) => {
    setStatus(next);
    setScheduleEnabled(next.schedule.enabled);
    setIntervalSeconds(next.schedule.intervalSeconds);
    setKeepDaily(String(next.retention.keepDaily));
    setKeepWeekly(String(next.retention.keepWeekly));
    setKeepMonthly(String(next.retention.keepMonthly));
    setAutoRotate(next.retention.autoRotate);
    setS3Enabled(next.offsite.enabled);
    setS3Endpoint(next.offsite.endpoint);
    setS3Region(next.offsite.region);
    setS3Bucket(next.offsite.bucket);
    setS3Prefix(next.offsite.prefix);
    setS3PathStyle(next.offsite.forcePathStyle);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBackups();
      applyStatus(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.backups.failed);
    } finally {
      setLoading(false);
    }
  }, [t.backups.failed]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatWhen = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : '—';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.backups.failed);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !status) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <>
      <section className="card">
        <header className="cardhead">
          <h2>{t.backups.statusTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.backups.statusLead}</p>
          {error && <div className="fr-error" role="alert">{error}</div>}
          {message && <div className="fr-ok" role="status">{message}</div>}
          <div className="formgrid">
            <div className="field">
              <label>{t.backups.lastSuccess}</label>
              <div>
                {formatWhen(status?.lastSuccess?.at)}
                {status?.stale ? ` · ${t.backups.stale}` : ''}
              </div>
            </div>
            <div className="field">
              <label>{t.backups.scheduler}</label>
              <div>
                {status?.heartbeat
                  ? `${status.heartbeat.kind} · ${formatWhen(status.heartbeat.at)}`
                  : t.backups.schedulerMissing}
              </div>
            </div>
            <div className="field">
              <label>{t.backups.lastOffsite}</label>
              <div>{formatWhen(status?.lastOffsite?.at)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => run(async () => {
                await api.exportBackup();
                setMessage(t.backups.exported);
              })}
            >
              {t.backups.exportNow}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="cardhead">
          <h2>{t.backups.scheduleTitle}</h2>
        </header>
        <div className="cardbody">
          <div className="formgrid">
            <div className="field">
              <label>{t.backups.scheduleEnabled}</label>
              <select
                value={scheduleEnabled ? 'on' : 'off'}
                onChange={(e) => setScheduleEnabled(e.target.value === 'on')}
              >
                <option value="on">{t.backups.on}</option>
                <option value="off">{t.backups.off}</option>
              </select>
            </div>
            <div className="field">
              <label>{t.backups.interval}</label>
              <select
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              >
                {SCHEDULE_INTERVAL_PRESETS.map((value) => (
                  <option key={value} value={value}>
                    {INTERVAL_LABEL[value] || value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => {
              await api.updateBackupSchedule({
                enabled: scheduleEnabled,
                intervalSeconds,
              });
              setMessage(t.backups.scheduleSaved);
            })}
          >
            {t.backups.saveSchedule}
          </button>
        </div>
      </section>

      <section className="card">
        <header className="cardhead">
          <h2>{t.backups.retentionTitle}</h2>
        </header>
        <div className="cardbody">
          <div className="formgrid">
            <div className="field">
              <label>{t.backups.keepDaily}</label>
              <input
                type="number"
                min={1}
                max={90}
                value={keepDaily}
                onChange={(e) => setKeepDaily(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.keepWeekly}</label>
              <input
                type="number"
                min={0}
                max={52}
                value={keepWeekly}
                onChange={(e) => setKeepWeekly(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.keepMonthly}</label>
              <input
                type="number"
                min={0}
                max={36}
                value={keepMonthly}
                onChange={(e) => setKeepMonthly(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.autoRotate}</label>
              <select
                value={autoRotate ? 'on' : 'off'}
                onChange={(e) => setAutoRotate(e.target.value === 'on')}
              >
                <option value="on">{t.backups.on}</option>
                <option value="off">{t.backups.off}</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => {
              await api.updateBackupRetention({
                keepDaily: Number(keepDaily),
                keepWeekly: Number(keepWeekly),
                keepMonthly: Number(keepMonthly),
                autoRotate,
              });
              setMessage(t.backups.retentionSaved);
            })}
          >
            {t.backups.saveRetention}
          </button>
        </div>
      </section>

      <section className="card">
        <header className="cardhead">
          <h2>{t.backups.artifactsTitle}</h2>
        </header>
        <div className="cardbody">
          {!status?.artifacts.length ? (
            <div className="empty">
              <h3>{t.backups.emptyTitle}</h3>
              <p>{t.backups.emptyBody}</p>
            </div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.backups.artifact}</th>
                    <th>{t.backups.size}</th>
                    <th>{t.backups.modified}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {status.artifacts.map((artifact) => (
                    <tr key={artifact.name}>
                      <td>{artifact.name}</td>
                      <td>{formatSize(artifact.sizeBytes)}</td>
                      <td>{formatWhen(artifact.modifiedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => api.downloadBackup(artifact.name)}
                          >
                            {t.backups.download}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(async () => {
                              await api.pushBackupOffsite(artifact.name);
                              setMessage(t.backups.pushed);
                            })}
                          >
                            {t.backups.push}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(async () => {
                              await api.deleteBackup(artifact.name);
                              setMessage(t.backups.deleted);
                            })}
                          >
                            {t.backups.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.backups.importTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.backups.importLead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.backups.importFile}</label>
              <input
                type="file"
                accept=".dump"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="field">
              <label>{t.backups.confirmReplace}</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="REPLACE"
                autoComplete="off"
              />
            </div>
          </div>
          <button
            type="button"
            className="primary"
            disabled={busy || !importFile}
            onClick={() => run(async () => {
              if (!importFile) return;
              await api.importBackup(importFile, confirm);
              setConfirm('');
              setImportFile(null);
              setMessage(t.backups.imported);
            })}
          >
            {t.backups.importNow}
          </button>
        </div>
      </section>

      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.backups.offsiteTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.backups.offsiteLead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.backups.offsiteEnabled}</label>
              <select
                value={s3Enabled ? 'on' : 'off'}
                onChange={(e) => setS3Enabled(e.target.value === 'on')}
              >
                <option value="on">{t.backups.on}</option>
                <option value="off">{t.backups.off}</option>
              </select>
            </div>
            <div className="field">
              <label>{t.backups.endpoint}</label>
              <input
                value={s3Endpoint}
                onChange={(e) => setS3Endpoint(e.target.value)}
                placeholder="https://s3.example.com"
              />
            </div>
            <div className="field">
              <label>{t.backups.region}</label>
              <input
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.bucket}</label>
              <input
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.prefix}</label>
              <input
                value={s3Prefix}
                onChange={(e) => setS3Prefix(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.backups.accessKey}</label>
              <input
                value={s3Key}
                onChange={(e) => setS3Key(e.target.value)}
                placeholder={status?.offsite.accessKeyConfigured ? '********' : ''}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>{t.backups.secretKey}</label>
              <input
                type="password"
                value={s3Secret}
                onChange={(e) => setS3Secret(e.target.value)}
                placeholder={status?.offsite.secretConfigured ? '********' : ''}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label>{t.backups.pathStyle}</label>
              <select
                value={s3PathStyle ? 'on' : 'off'}
                onChange={(e) => setS3PathStyle(e.target.value === 'on')}
              >
                <option value="on">{t.backups.on}</option>
                <option value="off">{t.backups.off}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => run(async () => {
                await api.updateBackupOffsite({
                  enabled: s3Enabled,
                  endpoint: s3Endpoint,
                  region: s3Region,
                  bucket: s3Bucket,
                  prefix: s3Prefix,
                  accessKeyId: s3Key || undefined,
                  secretAccessKey: s3Secret || undefined,
                  forcePathStyle: s3PathStyle,
                });
                setS3Key('');
                setS3Secret('');
                setMessage(t.backups.offsiteSaved);
              })}
            >
              {t.backups.saveOffsite}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(async () => {
                const res = await api.testBackupOffsite();
                setMessage(
                  res.data.ok ? t.backups.testOk : (res.data.error || t.backups.failed),
                );
              })}
            >
              {t.backups.testOffsite}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(async () => {
                await api.pushBackupOffsite();
                setMessage(t.backups.pushed);
              })}
            >
              {t.backups.pushLatest}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
