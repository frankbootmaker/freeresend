'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { usePrefs } from '@/contexts/PrefsContext';
import ListPager from './ListPager';

type LogStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'delivered'
  | 'bounced'
  | 'complained';

type PlatformLog = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  fromEmail: string;
  toEmails: string[];
  subject: string | null;
  status: LogStatus;
  messageId: string | null;
  errorMessage: string | null;
  domain: string | null;
  createdAt: string;
  htmlContent?: string | null;
  textContent?: string | null;
};

type TenantOption = { id: string; name: string; slug: string };

type Retention = {
  keepDays: number;
  stripBodyDays: number;
  lastRotateAt: string;
  lastPurged: number;
  lastStripped: number;
};

export default function PlatformLogsTab() {
  const { t, locale } = usePrefs();
  const [emails, setEmails] = useState<PlatformLog[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [retention, setRetention] = useState<Retention | null>(null);
  const [keepDays, setKeepDays] = useState('90');
  const [stripBodyDays, setStripBodyDays] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<PlatformLog | null>(null);
  const [q, setQ] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [logsRes, retentionRes] = await Promise.all([
        api.getPlatformLogs({
          q,
          tenant_id: tenantId,
          status,
          from,
          to,
          page,
          limit,
        }),
        api.getLogRetention(),
      ]);
      setEmails(logsRes.data.emails);
      setTenants(logsRes.data.tenants || []);
      setPagination(logsRes.data.pagination);
      const next = logsRes.data.retention
        ? logsRes.data.retention
        : retentionRes.data.retention;
      if (next) {
        setRetention(next);
        setKeepDays(String(next.keepDays));
        setStripBodyDays(String(next.stripBodyDays));
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.portalLogs.failed);
    } finally {
      setLoading(false);
    }
  }, [q, tenantId, status, from, to, page, limit, t.portalLogs.failed]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (value: LogStatus) => {
    const labels: Record<LogStatus, string> = {
      pending: t.domains.pending,
      sent: t.logs.sent,
      failed: t.logs.failed,
      delivered: t.logs.delivered,
      bounced: t.logs.bounced,
      complained: t.logs.complained,
    };
    return labels[value].toUpperCase();
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.getPlatformLog(id);
      setSelected(res.data.email);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.logs.loadFailed);
    }
  };

  const saveRetention = async () => {
    setMessage('');
    try {
      const res = await api.updateLogRetention({
        keepDays: Number(keepDays),
        stripBodyDays: Number(stripBodyDays),
      });
      setRetention(res.data.retention);
      setMessage(t.portalLogs.retentionSaved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.portalLogs.failed);
    }
  };

  const rotateNow = async () => {
    setMessage('');
    try {
      const res = await api.rotatePlatformLogs();
      setRetention(res.data.retention);
      setMessage(
        t.portalLogs.rotated(res.data.result.purged, res.data.result.stripped),
      );
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.portalLogs.failed);
    }
  };

  const exportOps = async () => {
    try {
      await api.downloadOpsExport(7);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.portalLogs.failed);
    }
  };

  const formatWhen = (iso: string) =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : '—';

  return (
    <>
      <section className="card">
        <header className="cardhead">
          <h2>{t.portalLogs.searchTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.portalLogs.searchLead}</p>
          <div className="filters">
            <input
              placeholder={t.logs.search}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <select
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t.portalLogs.anyTenant}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t.logs.anyStatus}</option>
              <option value="delivered">{t.logs.delivered}</option>
              <option value="bounced">{t.logs.bounced}</option>
              <option value="sent">{t.logs.sent}</option>
              <option value="failed">{t.logs.failed}</option>
              <option value="complained">{t.logs.complained}</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
            <button type="button" onClick={() => load()}>
              {t.logs.apply}
            </button>
          </div>

          {error && <div className="fr-error" role="alert">{error}</div>}
          {loading && emails.length === 0 ? (
            <div className="muted">{t.sending.loading}</div>
          ) : emails.length === 0 ? (
            <div className="empty">
              <h3>{t.logs.emptyTitle}</h3>
              <p>{t.logs.emptyBody}</p>
            </div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.logs.subject}</th>
                    <th>{t.health.tenant}</th>
                    <th>{t.logs.recipient}</th>
                    <th>{t.logs.status}</th>
                    <th>{t.logs.sentAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => openDetail(email.id)}
                          style={{
                            background: 'none',
                            border: 0,
                            padding: 0,
                            minHeight: 'auto',
                            color: 'inherit',
                            textAlign: 'left',
                          }}
                        >
                          {email.subject || t.logs.noSubject}
                        </button>
                      </td>
                      <td>{email.tenantName}</td>
                      <td>{email.toEmails.join(', ')}</td>
                      <td className={email.status === 'delivered' ? 'ok' : undefined}>
                        {statusLabel(email.status)}
                      </td>
                      <td>{formatWhen(email.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ListPager
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={limit}
            onPage={setPage}
            onLimit={(next) => {
              setPage(1);
              setLimit(next);
            }}
          />
        </div>
      </section>

      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.portalLogs.retainTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.portalLogs.retainLead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.portalLogs.keepDays}</label>
              <input
                type="number"
                min={0}
                max={3650}
                value={keepDays}
                onChange={(e) => setKeepDays(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.portalLogs.stripDays}</label>
              <input
                type="number"
                min={0}
                max={3650}
                value={stripBodyDays}
                onChange={(e) => setStripBodyDays(e.target.value)}
              />
            </div>
          </div>
          {retention?.lastRotateAt && (
            <p className="muted">
              {t.portalLogs.lastRotate(
                formatWhen(retention.lastRotateAt),
                retention.lastPurged,
                retention.lastStripped,
              )}
            </p>
          )}
          {message && <div className="fr-ok" role="status">{message}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="primary" onClick={saveRetention}>
              {t.portalLogs.saveRetention}
            </button>
            <button type="button" onClick={rotateNow}>
              {t.portalLogs.rotateNow}
            </button>
            <button type="button" onClick={exportOps}>
              {t.portalLogs.exportOps}
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 style={{ font: '23px var(--display)', margin: '0 0 16px' }}>
              {t.logs.details}
            </h2>
            <div className="formgrid">
              <div className="field">
                <label>{t.health.tenant}</label>
                <div>{selected.tenantName}</div>
              </div>
              <div className="field">
                <label>{t.logs.from}</label>
                <div>{selected.fromEmail}</div>
              </div>
              <div className="field">
                <label>{t.logs.to}</label>
                <div>{selected.toEmails.join(', ')}</div>
              </div>
              <div className="field">
                <label>{t.logs.status}</label>
                <div>{statusLabel(selected.status)}</div>
              </div>
            </div>
            <div className="field">
              <label>{t.logs.subject}</label>
              <div>{selected.subject || t.logs.noSubject}</div>
            </div>
            {selected.textContent && (
              <div className="field">
                <label>{t.logs.textContent}</label>
                <pre style={{ whiteSpace: 'pre-wrap', font: '11px var(--mono)' }}>
                  {selected.textContent}
                </pre>
              </div>
            )}
            {selected.errorMessage && (
              <div className="fr-error">{selected.errorMessage}</div>
            )}
            <button
              type="button"
              className="primary"
              style={{ marginTop: 16 }}
              onClick={() => setSelected(null)}
            >
              {t.logs.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
