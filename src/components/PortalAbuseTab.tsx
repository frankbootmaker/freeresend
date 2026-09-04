'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import type {
  AbuseSeverity,
  AbuseWarning,
  PlatformAbuseRow,
} from '@/lib/abuse-health';
import ListPager from './ListPager';

function severityClass(severity: AbuseSeverity): string {
  if (severity === 'high') return 'is-down';
  if (severity === 'warn') return 'is-warn';
  return 'is-off';
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function worstWarning(warnings: AbuseWarning[]): AbuseWarning | null {
  return [...warnings].sort((left, right) => {
    const rank = { high: 3, warn: 2, info: 1 };
    return rank[right.severity] - rank[left.severity];
  })[0] || null;
}

export default function PortalAbuseTab() {
  const router = useRouter();
  const { t } = usePrefs();
  const { switchTenant } = useAuth();
  const [rows, setRows] = useState<PlatformAbuseRow[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [unfreezingId, setUnfreezingId] = useState<string | null>(null);
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
      const res = await api.listPlatformAbuse({
        page,
        limit,
        open: openOnly,
      });
      setRows((res.data?.tenants || []) as PlatformAbuseRow[]);
      setOpenCount(Number(res.data?.openCount || 0));
      if (res.data?.pagination) setPagination(res.data.pagination);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.abuse.failed);
    } finally {
      setLoading(false);
    }
  }, [page, limit, openOnly, t.abuse.failed]);

  useEffect(() => {
    load();
  }, [load]);

  const poolLabel = (tier: string) => {
    if (tier === 'shared') return t.customers.tierShared;
    if (tier === 'byo') return t.customers.tierByo;
    if (tier === 'dedicated') return t.customers.tierDedicated;
    return t.customers.tierProbation;
  };

  const openTenant = async (tenantId: string) => {
    setOpeningId(tenantId);
    setError('');
    try {
      await switchTenant(tenantId);
      router.push('/');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.abuse.failed);
    } finally {
      setOpeningId(null);
    }
  };

  const unfreeze = async (tenantId: string) => {
    setUnfreezingId(tenantId);
    setError('');
    setMessage('');
    try {
      await api.updateCustomer(tenantId, { sendingFrozen: false });
      setMessage(t.customers.unfrozen);
      await load();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.customers.updateFailed);
    } finally {
      setUnfreezingId(null);
    }
  };

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.abuse.portalTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.abuse.portalLead}</p>
          <div className="filters">
            <button
              type="button"
              className={openOnly ? 'on' : undefined}
              aria-pressed={openOnly}
              onClick={() => {
                setLoading(true);
                setPage(1);
                setOpenOnly(true);
              }}
            >
              {t.abuse.filterOpen} ({openCount})
            </button>
            <button
              type="button"
              className={!openOnly ? 'on' : undefined}
              aria-pressed={!openOnly}
              onClick={() => {
                setLoading(true);
                setPage(1);
                setOpenOnly(false);
              }}
            >
              {t.abuse.filterAll}
            </button>
          </div>
          {error && <div className="fr-error" role="alert">{error}</div>}
          {message && <div className="fr-ok">{message}</div>}
          {loading ? (
            <p className="muted">{t.sending.loading}</p>
          ) : rows.length === 0 ? (
            <p className="cardlead">
              {openOnly ? t.abuse.emptyOpen : t.abuse.empty}
            </p>
          ) : (
            <table data-testid="portal-abuse-table">
              <thead>
                <tr>
                  <th>{t.customers.organization}</th>
                  <th>{t.customers.sendingTier}</th>
                  <th>{t.abuse.columnCaps}</th>
                  <th>{t.abuse.columnRates}</th>
                  <th>{t.abuse.columnWarnings}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const warning = worstWarning(row.warnings);
                  return (
                    <tr key={row.tenantId}>
                      <td>
                        <div>{row.name}</div>
                        <div className="muted">{row.slug}</div>
                      </td>
                      <td>{poolLabel(row.sendingTier)}</td>
                      <td>
                        {t.sending.capsLine(
                          row.used.hour,
                          row.caps.hourly,
                          row.used.day,
                          row.caps.daily,
                          row.used.month,
                          row.caps.monthly,
                        )}
                      </td>
                      <td>
                        {t.abuse.ratesShort(
                          row.last24h.total,
                          formatRate(row.last24h.bounceRate),
                          formatRate(row.last24h.complaintRate),
                        )}
                        {row.suppressionCount > 0
                          ? ` · ${t.abuse.suppressionsLine(row.suppressionCount)}`
                          : ''}
                      </td>
                      <td>
                        {row.sendingFrozenAt ? (
                          <span className="health-pill is-down">
                            {t.abuse.statusFrozen}
                          </span>
                        ) : warning ? (
                          <span className={`health-pill ${severityClass(warning.severity)}`}>
                            {t.abuse.warningTitle(warning.code)}
                          </span>
                        ) : (
                          t.abuse.noWarnings
                        )}
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button
                            type="button"
                            disabled={openingId === row.tenantId}
                            onClick={() => openTenant(row.tenantId)}
                          >
                            {openingId === row.tenantId
                              ? t.customers.opening
                              : t.customers.open}
                          </button>
                          {row.sendingFrozenAt ? (
                            <button
                              type="button"
                              disabled={unfreezingId === row.tenantId}
                              onClick={() => unfreeze(row.tenantId)}
                            >
                              {unfreezingId === row.tenantId
                                ? t.customers.unfreezing
                                : t.customers.unfreeze}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <ListPager
            page={pagination.page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPage={setPage}
            onLimit={(next) => {
              setPage(1);
              setLimit(next);
            }}
          />
        </div>
      </section>
    </div>
  );
}
