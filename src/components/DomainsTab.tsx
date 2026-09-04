'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  purpose?: string;
  status?: 'pending' | 'valid' | 'invalid';
  lane?: 'ses' | 'smtp';
}

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dns_records: DnsRecord[];
  created_at: string;
}

type RecordSet = 'ses' | 'smtp';

function recordLane(record: DnsRecord): RecordSet {
  if (record.lane === 'ses' || record.lane === 'smtp') return record.lane;
  if (record.purpose === 'ses_verify') return 'ses';
  if (record.type === 'CNAME' && /amazonses/i.test(record.value)) return 'ses';
  if (record.purpose === 'dkim' && record.type === 'TXT') return 'smtp';
  if (record.purpose === 'mx' && /inbound-smtp|amazonses/i.test(record.value)) {
    return 'ses';
  }
  if (record.purpose === 'mx') return 'smtp';
  if (record.purpose === 'spf' && /amazonses/i.test(record.value)) return 'ses';
  if (record.purpose === 'spf') return 'smtp';
  return 'ses';
}

export default function DomainsTab() {
  const { t } = usePrefs();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outboundTransport, setOutboundTransport] = useState<RecordSet>('ses');
  const [recordSet, setRecordSet] = useState<RecordSet>('ses');
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const response = await api.getDomains();
      const list = response.data.domains;
      setDomains(list);
      const transport =
        response.data.outboundTransport === 'smtp' ? 'smtp' : 'ses';
      setOutboundTransport(transport);
      setRecordSet(transport);
      if (list.length) setActiveId((current) => current || list[0].id);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    setError('');
    setMessage('');
    try {
      const response = await api.addDomain(newDomain.trim());
      const domain = response.data.domain as Domain;
      setDomains([domain, ...domains]);
      setNewDomain('');
      setActiveId(domain.id);
      setRecordSet(outboundTransport);
      setMessage(response.message || t.domains.cannotSend);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.domains.addFailed);
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setCheckingId(domainId);
    setError('');
    setMessage('');
    try {
      const response = await api.verifyDomain(domainId);
      await loadDomains();
      setActiveId(domainId);
      setMessage(response.message);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.domains.verifyFailed);
    } finally {
      setCheckingId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm(t.domains.confirmDelete)) return;
    setDeletingId(domainId);
    setError('');
    setMessage('');
    try {
      await api.deleteDomain(domainId);
      const next = domains.filter((domain) => domain.id !== domainId);
      setDomains(next);
      if (activeId === domainId) setActiveId(next[0]?.id || null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.domains.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  const statusLabel = (status: Domain['status'] | DnsRecord['status']) => {
    if (status === 'verified' || status === 'valid') return t.domains.verified.toUpperCase();
    if (status === 'failed' || status === 'invalid') return t.domains.invalid.toUpperCase();
    return t.domains.pending.toUpperCase();
  };

  const active = domains.find((d) => d.id === activeId);
  const viewingInactive = recordSet !== outboundTransport;
  const records = (active?.dns_records || []).filter(
    (record) => recordLane(record) === recordSet,
  );
  const sesHasFailover = records.some((record) => {
    if (recordSet !== 'ses') return false;
    if (record.purpose === 'dkim' && record.type === 'TXT') return true;
    return (
      record.purpose === 'spf'
      && /amazonses/i.test(record.value)
      && /(?:\ba:|\bip4:)/i.test(record.value)
    );
  });

  if (loading) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <section className="card">
      <header className="cardhead">
        <h2>{t.domains.dnsTitle}</h2>
      </header>
      <div className="cardbody">
        <form className="filters" onSubmit={handleAddDomain}>
          <input
            placeholder={t.domains.placeholder}
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={addingDomain}
          />
          <select
            value={activeId || ''}
            onChange={(e) => setActiveId(e.target.value || null)}
          >
            {domains.length === 0 && <option value="">{t.domains.noDomainYet}</option>}
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!active || viewingInactive}
            onClick={() => active && handleVerifyDomain(active.id)}
          >
            {checkingId === active?.id ? t.domains.checking : t.domains.check}
          </button>
          <button
            type="button"
            disabled={!active || deletingId === active?.id}
            onClick={() => active && handleDeleteDomain(active.id)}
          >
            {deletingId === active?.id ? t.domains.deleting : t.domains.delete}
          </button>
          <button className="primary" type="submit" disabled={addingDomain || !newDomain.trim()}>
            {addingDomain ? t.domains.adding : t.domains.add}
          </button>
        </form>

        {error && <div className="fr-error">{error}</div>}
        {message && <div className="fr-ok">{message}</div>}

        <div className="seg">
          <button
            type="button"
            className={recordSet === 'ses' ? 'on' : undefined}
            onClick={() => setRecordSet('ses')}
          >
            {t.domains.sesRecords}
            {outboundTransport === 'ses' && (
              <span className="lane-use">{t.domains.inUse}</span>
            )}
          </button>
          <button
            type="button"
            className={recordSet === 'smtp' ? 'on' : undefined}
            onClick={() => setRecordSet('smtp')}
          >
            {t.domains.smtpRecords}
            {outboundTransport === 'smtp' && (
              <span className="lane-use">{t.domains.inUse}</span>
            )}
          </button>
        </div>

        {!active ? (
          <div className="empty">
            <h3>{t.domains.emptyTitle}</h3>
            <p>{t.domains.empty}</p>
          </div>
        ) : (
          <>
            {viewingInactive && (
              <p className="cardlead dns-lane-note">
                {recordSet === 'ses' ? t.domains.inactiveSes : t.domains.inactiveSmtp}
              </p>
            )}
            {!viewingInactive && recordSet === 'ses' && sesHasFailover && (
              <p className="cardlead dns-lane-note">{t.domains.sesFailoverHint}</p>
            )}
            <div
              className={
                viewingInactive ? 'tablewrap dns-lane-inactive' : 'tablewrap'
              }
            >
              <table>
                <thead>
                  <tr>
                    <th>{t.domains.type}</th>
                    <th>{t.domains.host}</th>
                    <th>{t.domains.expectedValue}</th>
                    <th>{t.domains.state}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={`${active.id}-${recordSet}-${index}`}>
                      <td>
                        <code>{record.type}</code>
                      </td>
                      <td>{record.name}</td>
                      <td>
                        <code>{record.value}</code>
                      </td>
                      <td className={record.status === 'valid' ? 'ok' : undefined}>
                        {statusLabel(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
