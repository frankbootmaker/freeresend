'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

interface Domain {
  id: string;
  domain: string;
  status: string;
}

interface ApiKey {
  id: string;
  domain_id: string;
  key_name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at?: string;
  created_at: string;
  domains?: { domain: string };
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to execCommand for unfocused or older browsers.
  }

  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '0';
  field.style.left = '0';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(field);
  return copied;
}

export default function ApiKeysTab() {
  const { t } = usePrefs();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState({
    domainId: '',
    keyName: t.keys.labelPlaceholder,
    permissions: ['send'],
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apiKeysResponse, domainsResponse] = await Promise.all([
        api.getApiKeys(),
        api.getDomains(),
      ]);
      const allDomains = domainsResponse.data.domains as Domain[];
      setApiKeys(apiKeysResponse.data.apiKeys);
      setDomains(allDomains);
      const verified = allDomains.filter((d) => d.status === 'verified');
      setNewKey((current) => ({
        ...current,
        domainId: current.domainId || verified[0]?.id || allDomains[0]?.id || '',
      }));
    } catch (loadError) {
      console.error('Failed to load data:', loadError);
    } finally {
      setLoading(false);
    }
  };

  const verifiedDomains = domains.filter((d) => d.status === 'verified');

  const openCreateForm = () => {
    setError('');
    setCreatedKey(null);
    setCopied(false);
    setShowCreateForm(true);
    if (!newKey.domainId) {
      setNewKey((current) => ({
        ...current,
        domainId: verifiedDomains[0]?.id || domains[0]?.id || '',
        keyName: current.keyName || t.keys.labelPlaceholder,
      }));
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verifiedDomains.length === 0) {
      setError(t.keys.needVerified);
      return;
    }
    if (!newKey.domainId || !newKey.keyName.trim()) {
      setError(t.keys.chooseFields);
      return;
    }

    setCreating(true);
    try {
      const response = await api.createApiKey(
        newKey.domainId,
        newKey.keyName.trim(),
        newKey.permissions,
      );
      setApiKeys([response.data.apiKey, ...apiKeys]);
      setCreatedKey(response.data.apiKey.key);
      setCopied(false);
      setNewKey({
        domainId: verifiedDomains[0]?.id || '',
        keyName: t.keys.labelPlaceholder,
        permissions: ['send'],
      });
      setShowCreateForm(false);
    } catch (createError: unknown) {
      const errorObj = createError as { message?: string };
      setError(errorObj.message || t.keys.createFailed);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (
      !confirm(
        t.keys.confirmDelete,
      )
    ) {
      return;
    }

    try {
      await api.deleteApiKey(keyId);
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    } catch (deleteError: unknown) {
      const errorObj = deleteError as { message?: string };
      setError(errorObj.message || t.keys.deleteFailed);
    }
  };

  const copyCreatedKey = async () => {
    if (!createdKey) return;

    const copiedOk = await copyTextToClipboard(createdKey);
    if (copiedOk) {
      setError('');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      return;
    }

    setError(t.keys.copyFailed);
  };

  const maskApiKey = (keyPrefix: string) => `${keyPrefix}_${'…'.repeat(4)}`;

  const formatLastUsed = (date?: string) => {
    if (!date) return '—';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return t.keys.minutesAgo(minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return t.keys.hoursAgo(hours);
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <section className="card">
      <header className="cardhead">
        <h2>{t.keys.title}</h2>
      </header>
      <div className="cardbody">
        <button className="primary" type="button" onClick={openCreateForm}>
          {t.keys.create}
        </button>

        {createdKey && (
          <div className="key-reveal">
            <div className="key-reveal-head">
              <p className="key-reveal-hint">{t.keys.copyOnce}</p>
              <button type="button" onClick={copyCreatedKey} aria-live="polite">
                {copied ? t.keys.copied : t.keys.copy}
              </button>
            </div>
            <code>{createdKey}</code>
          </div>
        )}
        {error && <div className="fr-error">{error}</div>}

        {showCreateForm && (
          <form onSubmit={handleCreateKey} className="formgrid" style={{ marginTop: 12 }}>
            <div className="field">
              <label htmlFor="domain">{t.keys.domain}</label>
              <select
                id="domain"
                value={newKey.domainId}
                onChange={(e) =>
                  setNewKey({ ...newKey, domainId: e.target.value })
                }
                required
              >
                <option value="">{t.keys.selectDomain}</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                    {domain.status === 'verified'
                      ? ''
                      : ` (${
                          domain.status === 'failed'
                            ? t.domains.failed
                            : t.domains.pending
                        })`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="keyName">{t.keys.label}</label>
              <input
                id="keyName"
                value={newKey.keyName}
                onChange={(e) =>
                  setNewKey({ ...newKey, keyName: e.target.value })
                }
                placeholder={t.keys.labelPlaceholder}
                required
              />
            </div>
            <div className="field" style={{ alignSelf: 'end', display: 'flex', gap: 8 }}>
              <button className="primary" type="submit" disabled={creating}>
                {creating ? t.keys.creating : t.keys.createSubmit}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                {t.keys.cancel}
              </button>
            </div>
          </form>
        )}

        {apiKeys.length === 0 && !showCreateForm ? (
          <div className="empty">
            <h3>{t.keys.emptyTitle}</h3>
            <p>{t.keys.emptyBody}</p>
          </div>
        ) : (
          apiKeys.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>{t.keys.label}</th>
                  <th>{t.keys.prefix}</th>
                  <th>{t.keys.scope}</th>
                  <th>{t.keys.lastUsed}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.key_name}</td>
                    <td>
                      <code>{maskApiKey(key.key_prefix)}</code>
                    </td>
                    <td>
                      {key.permissions.includes('send')
                        ? 'send:write'
                        : key.permissions.join(':')}
                    </td>
                    <td>{formatLastUsed(key.last_used_at)}</td>
                    <td>
                      <button type="button" onClick={() => handleDeleteKey(key.id)}>
                        {t.keys.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </section>
  );
}
