'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { usePrefs } from '@/contexts/PrefsContext';
import ListPager from './ListPager';

interface EmailLog {
  id: string;
  from_email: string;
  to_emails: string[];
  subject: string;
  status:
    | 'pending'
    | 'sent'
    | 'failed'
    | 'delivered'
    | 'bounced'
    | 'complained';
  created_at: string;
  domains?: { domain: string };
  api_keys?: { key_name: string };
  html_content?: string;
  text_content?: string;
  error_message?: string;
}

export default function EmailLogsTab() {
  const { t } = usePrefs();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    from: '',
    domain_id: '',
    status: '',
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
      );
      const response = await api.getEmailLogs(params);
      setEmails(response.data.emails || []);
      if (response.data.pagination) setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handleEmailClick = async (emailId: string) => {
    try {
      const response = await api.getEmail(emailId);
      setSelectedEmail(response.data.email);
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      alert(errorObj.message || t.logs.loadFailed);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters({ ...filters, page: 1, limit: newLimit });
  };

  const statusLabel = (status: EmailLog['status']) => {
    const labels: Record<EmailLog['status'], string> = {
      pending: t.domains.pending,
      sent: t.logs.sent,
      failed: t.logs.failed,
      delivered: t.logs.delivered,
      bounced: t.logs.bounced,
      complained: t.logs.complained,
    };
    return labels[status].toUpperCase();
  };

  if (loading && emails.length === 0) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <>
      <section className="card">
        <header className="cardhead">
          <h2>{t.logs.title}</h2>
        </header>
        <div className="cardbody">
          <div className="filters">
            <input
              placeholder={t.logs.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setFilters({ ...filters, q, from, page: 1 });
                }
              }}
            />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value,
                  q,
                  from,
                  page: 1,
                })
              }
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
              onChange={(e) => setFrom(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setFilters({ ...filters, q, from, page: 1 })}
            >
              {t.logs.apply}
            </button>
          </div>

          {emails.length === 0 ? (
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
                    <th>{t.logs.recipient}</th>
                    <th>{t.logs.status}</th>
                    <th>{t.logs.domain}</th>
                    <th>{t.logs.sentAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleEmailClick(email.id)}
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
                      <td>{email.to_emails.join(', ')}</td>
                      <td className={email.status === 'delivered' ? 'ok' : undefined}>
                        {statusLabel(email.status)}
                      </td>
                      <td>{email.domains?.domain || '—'}</td>
                      <td>{new Date(email.created_at).toLocaleString()}</td>
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
            limit={filters.limit}
            onPage={handlePageChange}
            onLimit={handleLimitChange}
          />
        </div>
      </section>

      {selectedEmail && (
        <div className="modal-backdrop" onClick={() => setSelectedEmail(null)}>
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
                <label>{t.logs.from}</label>
                <div>{selectedEmail.from_email}</div>
              </div>
              <div className="field">
                <label>{t.logs.status}</label>
                <div className={selectedEmail.status === 'delivered' ? 'ok' : undefined}>
                  {statusLabel(selectedEmail.status)}
                </div>
              </div>
              <div className="field">
                <label>{t.logs.to}</label>
                <div>{selectedEmail.to_emails.join(', ')}</div>
              </div>
              <div className="field">
                <label>{t.logs.created}</label>
                <div>{new Date(selectedEmail.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div className="field">
              <label>{t.logs.subject}</label>
              <div>{selectedEmail.subject || t.logs.noSubject}</div>
            </div>
            {selectedEmail.text_content && (
              <div className="field">
                <label>{t.logs.textContent}</label>
                <pre style={{ whiteSpace: 'pre-wrap', font: '11px var(--mono)' }}>
                  {selectedEmail.text_content}
                </pre>
              </div>
            )}
            {selectedEmail.error_message && (
              <div className="fr-error">{selectedEmail.error_message}</div>
            )}
            <button
              type="button"
              className="primary"
              style={{ marginTop: 16 }}
              onClick={() => setSelectedEmail(null)}
            >
              {t.logs.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
