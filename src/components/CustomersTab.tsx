'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import ListPager from './ListPager';
import {
  registryFilterFromSearch,
  tenantAllowsByoSes,
  tenantHasPendingByoRequest,
  tenantSesByoRequestedAt,
  type TenantRegistryFilter,
} from '@/lib/tenant-ses';
import type { Locale } from '@/lib/locale';

function formatWhen(value: string, locale: Locale) {
  const tag = locale === 'de' ? 'de-DE' : locale === 'hu' ? 'hu-HU' : 'en-GB';
  return new Date(value).toLocaleString(tag);
}

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  inbound_transport?: string;
  outbound_transport: string;
  metadata?: Record<string, unknown>;
};

export default function CustomersTab() {
  const { t, locale } = usePrefs();
  const { switchTenant } = useAuth();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [transport, setTransport] = useState<'ses' | 'smtp'>('ses');
  const [ingress, setIngress] = useState<'https' | 'smtp' | 'both'>('both');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [managed, setManaged] = useState<TenantRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editByo, setEditByo] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [panelResult, setPanelResult] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [registryFilter, setRegistryFilter] = useState<
    TenantRegistryFilter | ''
  >('');
  const [deciding, setDeciding] = useState<'approve' | 'deny' | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const refresh = useCallback(() => {
    return api
      .listCustomers({
        page,
        limit,
        q: appliedQ,
        byo: registryFilter || undefined,
      })
      .then((res) => {
        setTenants(res.data.tenants || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      });
  }, [page, limit, appliedQ, registryFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filterLabels: Record<TenantRegistryFilter, string> = {
    requested: t.customers.sesByoRequested,
    approved: t.customers.sesByoApprovedTag,
  };

  const applyRegistryFilter = (next: TenantRegistryFilter | '') => {
    setPage(1);
    setRegistryFilter(next);
    if (registryFilterFromSearch(q, filterLabels)) setQ('');
    setAppliedQ((current) =>
      registryFilterFromSearch(current, filterLabels) ? '' : current,
    );
  };

  const applySearch = () => {
    const fromSearch = registryFilterFromSearch(q, filterLabels);
    setPage(1);
    if (fromSearch) {
      setRegistryFilter(fromSearch);
      setAppliedQ('');
      setQ(filterLabels[fromSearch]);
      return;
    }
    setAppliedQ(q);
  };

  const ingressLabel = (value?: string) => {
    if (value === 'both') return t.sending.both;
    if (value === 'smtp') return t.sending.smtp;
    return t.sending.https;
  };

  const routeLabel = (row: TenantRow) =>
    `${ingressLabel(row.inbound_transport)} / ${
      row.outbound_transport === 'smtp' ? t.sending.smtp : 'SES'
    }`;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    try {
      const res = await api.createCustomer({
        name,
        ownerEmail,
        ownerPassword: ownerPassword || undefined,
        domain: domain || undefined,
        outboundTransport: transport,
        inboundTransport: ingress,
        createApiKey: Boolean(domain),
        createMcpToken: true,
      });
      const secrets = [
        res.data.apiKey ? `${t.customers.apiKey}: ${res.data.apiKey}` : '',
        res.data.mcpToken ? `${t.customers.mcpToken}: ${res.data.mcpToken}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      setResult(`${t.customers.created(res.data.tenant.slug)}\n${secrets}`);
      setName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setDomain('');
      setPage(1);
      refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.customers.failed);
    }
  };

  const openManage = (row: TenantRow) => {
    setError('');
    setResult('');
    setPanelError('');
    setPanelResult('');
    setManaged(row);
    setEditName(row.name);
    setEditByo(tenantAllowsByoSes(row));
  };

  const closeManage = () => {
    setManaged(null);
    setEditName('');
    setPanelError('');
    setPanelResult('');
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!managed) return;
    setPanelError('');
    setPanelResult('');
    setSaving(true);
    try {
      const res = await api.updateCustomer(managed.id, {
        name: editName,
        sesByoAllowed: tenantHasPendingByoRequest(managed)
          ? undefined
          : editByo,
      });
      const next = res.data?.tenant;
      const nextName = next?.name || editName.trim();
      const nextMeta = next?.metadata || { ...managed.metadata };
      setManaged({ ...managed, name: nextName, metadata: nextMeta });
      setEditName(nextName);
      setEditByo(tenantAllowsByoSes({ metadata: nextMeta }));
      setPanelResult(t.customers.updated);
      refresh();
    } catch (err: unknown) {
      setPanelError(
        (err as { message?: string }).message || t.customers.updateFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const decideByo = async (decision: 'approve' | 'deny') => {
    if (!managed) return;
    setPanelError('');
    setPanelResult('');
    setDeciding(decision);
    try {
      const res = await api.updateCustomer(managed.id, {
        sesByoDecision: decision,
      });
      const next = res.data?.tenant;
      const nextMeta = next?.metadata || {};
      const nextName = next?.name || managed.name;
      setManaged({ ...managed, name: nextName, metadata: nextMeta });
      setEditByo(tenantAllowsByoSes({ metadata: nextMeta }));
      setPanelResult(
        decision === 'approve'
          ? t.customers.sesByoApproved
          : t.customers.sesByoDenied,
      );
      refresh();
    } catch (err: unknown) {
      setPanelError(
        (err as { message?: string }).message || t.customers.updateFailed,
      );
    } finally {
      setDeciding(null);
    }
  };

  const removeTenant = async () => {
    if (!managed || managed.slug === 'platform') return;
    if (!confirm(t.customers.confirmDelete)) return;
    setPanelError('');
    setPanelResult('');
    setDeleting(true);
    try {
      await api.deleteCustomer(managed.id);
      setResult(t.customers.deleted);
      closeManage();
      refresh();
    } catch (err: unknown) {
      setPanelError(
        (err as { message?: string }).message || t.customers.deleteFailed,
      );
    } finally {
      setDeleting(false);
    }
  };

  const openTenant = async (tenantId: string) => {
    setError('');
    setOpeningId(tenantId);
    try {
      await switchTenant(tenantId);
      window.location.assign('/');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.customers.failed);
      setOpeningId(null);
    }
  };

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.customers.provision}</h2>
        </header>
        <form className="cardbody" onSubmit={create}>
          <div className="formgrid">
            <div className="field">
              <label>{t.customers.org}</label>
              <input
                required
                placeholder="Northstar GmbH"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.customers.ownerEmail}</label>
              <input
                type="email"
                required
                placeholder="ops@northstar.test"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.customers.tempPassword}</label>
              <input
                type="password"
                placeholder={t.customers.passwordPlaceholder}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.customers.domainOptional}</label>
              <input
                placeholder="northstar.test"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.customers.ingress}</label>
              <select
                value={ingress}
                onChange={(e) =>
                  setIngress(e.target.value as 'https' | 'smtp' | 'both')
                }
              >
                <option value="both">{t.customers.bothIngress}</option>
                <option value="https">{t.sending.https}</option>
                <option value="smtp">{t.sending.smtp}</option>
              </select>
            </div>
            <div className="field">
              <label>{t.customers.egress}</label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as 'ses' | 'smtp')}
              >
                <option value="ses">{t.sending.amazonSes}</option>
                <option value="smtp">{t.sending.smtpRelay}</option>
              </select>
            </div>
          </div>
          <button className="primary" type="submit">
            {t.customers.provisionAction}
          </button>
          {error && <div className="fr-error">{error}</div>}
          {result && <div className="key">{result}</div>}
        </form>
      </section>
      <section className="card">
        <header className="cardhead">
          <h2>{t.customers.registry}</h2>
        </header>
        <div className="cardbody">
          <div className="filters">
            <input
              placeholder={t.customers.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
            <select
              aria-label={t.customers.filter}
              value={registryFilter}
              onChange={(e) =>
                applyRegistryFilter(
                  e.target.value as TenantRegistryFilter | '',
                )
              }
            >
              <option value="">{t.customers.filterAll}</option>
              <option value="requested">{t.customers.sesByoRequested}</option>
              <option value="approved">{t.customers.sesByoApprovedTag}</option>
            </select>
            <button type="button" onClick={applySearch}>
              {t.logs.apply}
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t.customers.organization}</th>
                <th>{t.customers.route}</th>
                <th>{t.customers.state}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div>{row.name}</div>
                    {tenantAllowsByoSes(row) ? (
                      <button
                        type="button"
                        className="tag-filter"
                        onClick={() => applyRegistryFilter('approved')}
                      >
                        {t.customers.sesByoApprovedTag}
                      </button>
                    ) : tenantHasPendingByoRequest(row) ? (
                      <button
                        type="button"
                        className="tag-filter"
                        onClick={() => applyRegistryFilter('requested')}
                      >
                        {t.customers.sesByoRequested}
                      </button>
                    ) : null}
                  </td>
                  <td>{routeLabel(row)}</td>
                  <td className="ok">{row.status.toUpperCase()}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        type="button"
                        disabled={openingId === row.id}
                        onClick={() => openTenant(row.id)}
                      >
                        {openingId === row.id
                          ? t.customers.opening
                          : t.customers.open}
                      </button>
                      <button type="button" onClick={() => openManage(row)}>
                        {t.customers.manage}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && registryFilter === 'requested' && (
            <p className="cardlead">{t.customers.sesByoEmpty}</p>
          )}
          {tenants.length === 0 && registryFilter === 'approved' && (
            <p className="cardlead">{t.customers.sesByoEmptyApproved}</p>
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
      {managed && (
        <div className="modal-backdrop" onClick={closeManage}>
          <div
            className="modal-panel tenant-manage"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-manage-title"
          >
            <div className="releasenotes-head">
              <h2 id="tenant-manage-title">
                {t.customers.manageTitle(managed.name)}
              </h2>
              <button type="button" onClick={closeManage}>
                {t.customers.close}
              </button>
            </div>
            <form onSubmit={saveName}>
              <div className="formgrid">
                <div className="field">
                  <label>{t.customers.org}</label>
                  <input
                    required
                    maxLength={120}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{t.customers.slug}</label>
                  <div>{managed.slug}</div>
                  <p className="muted">{t.customers.slugHint}</p>
                </div>
                <div className="field">
                  <label>{t.customers.route}</label>
                  <div>{routeLabel(managed)}</div>
                </div>
                <div className="field">
                  <label>{t.customers.state}</label>
                  <div className="ok">{managed.status.toUpperCase()}</div>
                </div>
                <div className="field">
                  <label>{t.customers.invoiceGroup}</label>
                  <select
                    disabled
                    value={editByo ? 'byo' : 'none'}
                    aria-label={t.customers.invoiceGroup}
                  >
                    <option value="none">{t.customers.invoiceGroupNone}</option>
                    <option value="byo">{t.customers.invoiceGroupByo}</option>
                  </select>
                  <p className="muted">{t.customers.invoiceGroupHint}</p>
                </div>
                {tenantHasPendingByoRequest(managed) ? (
                  <div className="field field-span">
                    <label>{t.customers.sesByoRequested}</label>
                    <p className="muted">
                      {t.customers.sesByoRequestedOn(
                        formatWhen(tenantSesByoRequestedAt(managed)!, locale),
                      )}
                    </p>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="primary"
                        disabled={Boolean(deciding)}
                        onClick={() => decideByo('approve')}
                      >
                        {deciding === 'approve'
                          ? t.customers.sesByoApproving
                          : t.customers.sesByoApprove}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deciding)}
                        onClick={() => decideByo('deny')}
                      >
                        {deciding === 'deny'
                          ? t.customers.sesByoDenying
                          : t.customers.sesByoDeny}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label className="checkline">
                      <input
                        type="checkbox"
                        checked={editByo}
                        onChange={(e) => setEditByo(e.target.checked)}
                      />
                      <span>{t.customers.sesByoAllowed}</span>
                    </label>
                    <p className="muted">{t.customers.sesByoAllowedHint}</p>
                  </div>
                )}
              </div>
              <div className="inline-actions">
                <button className="primary" type="submit" disabled={saving}>
                  {saving ? t.customers.saving : t.customers.save}
                </button>
              </div>
            </form>
            {panelError && (
              <div className="fr-error" role="alert">{panelError}</div>
            )}
            {panelResult && <div className="key">{panelResult}</div>}
            <div className="manage-danger">
              <h3>{t.customers.dangerZone}</h3>
              {managed.slug === 'platform' ? (
                <p className="muted">{t.customers.platformProtected}</p>
              ) : (
                <>
                  <p className="muted">{t.customers.deleteLead}</p>
                  <button
                    type="button"
                    className="danger"
                    disabled={deleting}
                    onClick={removeTenant}
                  >
                    {deleting ? t.customers.deleting : t.customers.delete}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
