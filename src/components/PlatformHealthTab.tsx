'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';
import type {
  HealthCheck,
  HealthState,
  HealthVolume,
  PlatformHealth,
} from '@/lib/platform-health';

const STATUS_KEYS = [
  'sent',
  'delivered',
  'pending',
  'bounced',
  'complained',
  'failed',
] as const;

function stateClass(state: HealthState): string {
  if (state === 'ok') return 'is-ok';
  if (state === 'warn') return 'is-warn';
  if (state === 'down') return 'is-down';
  return 'is-off';
}

export default function PlatformHealthTab() {
  const { t, locale } = usePrefs();
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPlatformHealth();
      setHealth(res.data.health);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.health.failed);
    } finally {
      setLoading(false);
    }
  }, [t.health.failed]);

  useEffect(() => {
    load();
  }, [load]);

  const stateLabel = (state: HealthState) => {
    if (state === 'ok') return t.health.ok;
    if (state === 'warn') return t.health.warn;
    if (state === 'down') return t.health.down;
    return t.health.off;
  };

  const checkTitle = (id: HealthCheck['id']) => {
    if (id === 'database') return t.health.database;
    if (id === 'ses') return t.health.ses;
    if (id === 'backup') return t.health.backup;
    return t.health.smtp;
  };

  const checkDetail = (detail: string) => {
    const labels: Record<string, string> = {
      Reachable: t.health.detailReachable,
      'Credentials accepted': t.health.detailSesOk,
      'Credentials are not configured': t.health.detailSesMissing,
      'Not configured — SMTP relay is the fallback': t.health.detailSesFallback,
      'Relay is disabled': t.health.detailSmtpOff,
      'Enabled without a host': t.health.detailSmtpNoHost,
      'Not checked': t.health.detailNotChecked,
      'Last dump succeeded': t.health.detailBackupFresh,
      'Last dump is older than the stale threshold': t.health.detailBackupStale,
      'Last scheduled dump failed': t.health.detailBackupFailed,
      'No dump has been recorded': t.health.detailBackupMissing,
      'Backup scheduler is not detected': t.health.detailBackupSchedulerMissing,
    };
    return labels[detail] || detail;
  };

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      sent: t.health.sent,
      delivered: t.health.delivered,
      pending: t.health.pending,
      bounced: t.health.bounced,
      complained: t.health.complained,
      failed: t.health.failedStatus,
    };
    return labels[status] || status;
  };

  const renderVolume = (title: string, volume: HealthVolume) => (
    <section className="card">
      <header className="cardhead">
        <h2>{title}</h2>
      </header>
      <div className="cardbody">
        <p className="health-total">
          <strong>{volume.total}</strong>
          <span>{t.health.total}</span>
        </p>
        <dl className="health-breakdown">
          {STATUS_KEYS.map((key) => (
            <div key={key}>
              <dt>{statusLabel(key)}</dt>
              <dd>{volume.byStatus[key] || 0}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );

  return (
    <div>
      <div className="health-toolbar">
        <p className="cardlead">
          {health
            ? t.health.checkedAt(formatWhen(health.checkedAt))
            : t.health.lead}
        </p>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? t.health.loading : t.health.refresh}
        </button>
      </div>
      {error && <div className="fr-error" role="alert">{error}</div>}
      {health && (
        <>
          <section className="card settings-alerts">
            <header className="cardhead">
              <h2>{t.health.checks}</h2>
              <span className={`health-pill ${stateClass(
                health.overall === 'ok'
                  ? 'ok'
                  : health.overall === 'down'
                    ? 'down'
                    : 'warn',
              )}`}
              >
                {health.overall === 'ok'
                  ? t.health.ok
                  : health.overall === 'down'
                    ? t.health.down
                    : t.health.degraded}
              </span>
            </header>
            <div className="cardbody">
              <div className="health-checks">
                {health.checks.map((check) => (
                  <article
                    key={check.id}
                    className={`health-check ${stateClass(check.state)}`}
                  >
                    <header>
                      <h3>{checkTitle(check.id)}</h3>
                      <span className={`health-pill ${stateClass(check.state)}`}>
                        {stateLabel(check.state)}
                      </span>
                    </header>
                    <p>{checkDetail(check.detail)}</p>
                    {check.latencyMs !== undefined && (
                      <p className="muted">
                        {t.health.latency(check.latencyMs)}
                      </p>
                    )}
                    {check.lastSuccessAt && (
                      <p className="muted">
                        {t.health.lastDump(formatWhen(check.lastSuccessAt))}
                      </p>
                    )}
                    {check.region && (
                      <p className="muted">{t.health.region(check.region)}</p>
                    )}
                    {check.max24HourSend !== undefined && (
                      <p className="muted">
                        {t.health.sesQuota(
                          check.sentLast24Hours || 0,
                          check.max24HourSend,
                        )}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
          <div className="cols">
            {renderVolume(t.health.volume24h, health.volume24h)}
            {renderVolume(t.health.volume7d, health.volume7d)}
          </div>
          <div className="cols">
            <section className="card">
              <header className="cardhead">
                <h2>{t.health.inventory}</h2>
              </header>
              <div className="cardbody">
                <dl className="health-breakdown">
                  <div>
                    <dt>{t.health.tenants}</dt>
                    <dd>{health.tenants.total}</dd>
                  </div>
                  <div>
                    <dt>{t.health.active}</dt>
                    <dd>{health.tenants.active}</dd>
                  </div>
                  <div>
                    <dt>{t.health.domains}</dt>
                    <dd>{health.domains.total}</dd>
                  </div>
                  <div>
                    <dt>{t.health.verified}</dt>
                    <dd>{health.domains.verified}</dd>
                  </div>
                  <div>
                    <dt>{t.health.pendingDomains}</dt>
                    <dd>{health.domains.pending}</dd>
                  </div>
                  <div>
                    <dt>{t.health.failedDomains}</dt>
                    <dd>{health.domains.failed}</dd>
                  </div>
                </dl>
              </div>
            </section>
            <section className="card">
              <header className="cardhead">
                <h2>{t.health.topTenants}</h2>
              </header>
              <div className="cardbody">
                {health.topTenants.length === 0 ? (
                  <p className="muted">{t.health.emptyTenants}</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>{t.health.tenant}</th>
                        <th>{t.health.total}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.topTenants.map((row) => (
                        <tr key={row.slug}>
                          <td>{row.name}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
          <section className="card settings-alerts">
            <header className="cardhead">
              <h2>{t.health.recentFailures}</h2>
            </header>
            <div className="cardbody">
              {health.recentFailures.length === 0 ? (
                <p className="muted">{t.health.emptyFailures}</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{t.health.when}</th>
                      <th>{t.health.tenant}</th>
                      <th>{t.health.from}</th>
                      <th>{t.health.to}</th>
                      <th>{t.health.subject}</th>
                      <th>{t.health.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.recentFailures.map((row) => (
                      <tr key={row.id}>
                        <td>{formatWhen(row.createdAt)}</td>
                        <td>{row.tenant}</td>
                        <td>{row.from}</td>
                        <td>{row.to}</td>
                        <td>{row.subject}</td>
                        <td>
                          {statusLabel(row.status)}
                          {row.error ? ` — ${row.error}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
