'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';

type AdminRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export default function PlatformUsersTab() {
  const { t, locale } = usePrefs();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await api.listPlatformUsers();
    setAdmins(res.data.users || []);
  }, []);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError((err as { message?: string }).message || t.users.failed);
    });
  }, [refresh, t.users.failed]);

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    setSaving(true);
    try {
      const res = await api.createPlatformUser({
        name: name || undefined,
        email,
        password: password || undefined,
      });
      setResult(
        res.data.created ? t.users.created : t.users.promoted,
      );
      setName('');
      setEmail('');
      setPassword('');
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.users.failed);
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    setError('');
    setResult('');
    setBusyId(id);
    try {
      await api.revokePlatformUser(id);
      setResult(t.users.revoked);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.users.failed);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t.users.confirmDelete)) return;
    setError('');
    setResult('');
    setBusyId(id);
    try {
      await api.deletePlatformUser(id);
      setResult(t.users.deleted);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.users.failed);
    } finally {
      setBusyId(null);
    }
  };

  const savePassword = async (e: FormEvent, id: string) => {
    e.preventDefault();
    setError('');
    setResult('');
    setBusyId(id);
    try {
      await api.updatePlatformUser(id, { password: resetPassword });
      setResult(t.users.passwordUpdated);
      setResetId(null);
      setResetPassword('');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.users.failed);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.users.addTitle}</h2>
        </header>
        <form className="cardbody" onSubmit={create}>
          <p className="cardlead">{t.users.addLead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.users.name}</label>
              <input
                placeholder={t.users.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.users.email}</label>
              <input
                type="email"
                required
                placeholder="ops@nethorizon.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.users.password}</label>
              <input
                type="password"
                placeholder={t.users.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? t.users.adding : t.users.addAction}
          </button>
          {error && <div className="fr-error" role="alert">{error}</div>}
          {result && <div className="key">{result}</div>}
        </form>
      </section>
      <section className="card">
        <header className="cardhead">
          <h2>{t.users.registry}</h2>
        </header>
        <div className="cardbody">
          {admins.length === 0 ? (
            <p className="muted">{t.users.empty}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.users.name}</th>
                  <th>{t.users.email}</th>
                  <th>{t.users.added}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((row) => {
                  const isYou = row.id === user?.id;
                  return (
                    <tr key={row.id}>
                      <td>
                        {row.name || '—'}
                        {isYou ? ` · ${t.users.you}` : ''}
                      </td>
                      <td>{row.email}</td>
                      <td>{formatWhen(row.createdAt)}</td>
                      <td>
                        {resetId === row.id ? (
                          <form
                            className="inline-actions"
                            onSubmit={(e) => savePassword(e, row.id)}
                          >
                            <input
                              type="password"
                              required
                              minLength={8}
                              placeholder={t.users.newPassword}
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                            />
                            <button
                              type="submit"
                              disabled={busyId === row.id}
                            >
                              {t.users.savePassword}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetId(null);
                                setResetPassword('');
                              }}
                            >
                              {t.users.cancel}
                            </button>
                          </form>
                        ) : (
                          <div className="inline-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setResetId(row.id);
                                setResetPassword('');
                              }}
                            >
                              {t.users.setPassword}
                            </button>
                            {!isYou && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === row.id}
                                  onClick={() => revoke(row.id)}
                                >
                                  {busyId === row.id
                                    ? t.users.revoking
                                    : t.users.revoke}
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === row.id}
                                  onClick={() => remove(row.id)}
                                >
                                  {busyId === row.id
                                    ? t.users.deleting
                                    : t.users.delete}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
