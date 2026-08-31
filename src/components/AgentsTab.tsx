'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

type AgentRow = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at?: string;
  created_at?: string;
};

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through for older browsers.
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.focus();
  field.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(field);
  return copied;
}

export default function AgentsTab({
  kind,
}: {
  kind: 'platform' | 'tenant';
}) {
  const { t, locale } = usePrefs();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const endpoint = `${typeof window !== 'undefined' ? window.location.origin : ''}/mcp`;

  const refresh = useCallback(async () => {
    const res = kind === 'platform'
      ? await api.listPlatformAgents()
      : await api.listTenantAgents();
    setAgents(res.data.agents || []);
  }, [kind]);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError((err as { message?: string }).message || t.agents.failed);
    });
  }, [refresh, t.agents.failed]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatedToken(null);
    setCopied(false);
    setSaving(true);
    try {
      const res = kind === 'platform'
        ? await api.createPlatformAgent(name)
        : await api.createTenantAgent(name);
      setCreatedToken(res.data.token);
      setName('');
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.agents.failed);
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm(t.agents.confirmRevoke)) return;
    setError('');
    setBusyId(id);
    try {
      if (kind === 'platform') await api.revokePlatformAgent(id);
      else await api.revokeTenantAgent(id);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.agents.failed);
    } finally {
      setBusyId(null);
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    const ok = await copyTextToClipboard(createdToken);
    if (!ok) {
      setError(t.agents.copyFailed);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const formatWhen = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.agents.addTitle}</h2>
        </header>
        <form className="cardbody" onSubmit={create}>
          <p className="cardlead">
            {kind === 'platform' ? t.agents.platformLead : t.agents.tenantLead}
          </p>
          <p className="muted">
            {t.agents.endpoint}: <code>{endpoint}</code>
          </p>
          <div className="formgrid">
            <div className="field">
              <label>{t.agents.name}</label>
              <input
                required
                maxLength={80}
                placeholder={t.agents.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? t.agents.adding : t.agents.addAction}
          </button>
          {createdToken && (
            <div className="key-reveal">
              <div className="key-reveal-head">
                <p className="key-reveal-hint">{t.agents.copyOnce}</p>
                <button type="button" onClick={copyToken} aria-live="polite">
                  {copied ? t.agents.copied : t.agents.copy}
                </button>
              </div>
              <code>{createdToken}</code>
            </div>
          )}
          {error && <div className="fr-error" role="alert">{error}</div>}
        </form>
      </section>
      <section className="card">
        <header className="cardhead">
          <h2>{t.agents.registry}</h2>
        </header>
        <div className="cardbody">
          {agents.length === 0 ? (
            <p className="muted">{t.agents.empty}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.agents.name}</th>
                  <th>{t.agents.prefix}</th>
                  <th>{t.agents.lastUsed}</th>
                  <th>{t.agents.added}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {agents.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td><code>{row.key_prefix}_…</code></td>
                    <td>{formatWhen(row.last_used_at)}</td>
                    <td>{formatWhen(row.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="tenant-open"
                        disabled={busyId === row.id}
                        onClick={() => revoke(row.id)}
                      >
                        {busyId === row.id ? t.agents.revoking : t.agents.revoke}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
