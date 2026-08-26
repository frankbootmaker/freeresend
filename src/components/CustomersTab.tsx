'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  inbound_transport?: string;
  outbound_transport: string;
};

export default function CustomersTab() {
  const { t } = usePrefs();
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

  const refresh = () => {
    api.listCustomers().then((res) => setTenants(res.data.tenants || []));
  };

  useEffect(() => {
    refresh();
  }, []);

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
      refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.customers.failed);
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
                  <td>{row.name}</td>
                  <td>{routeLabel(row)}</td>
                  <td className="ok">{row.status.toUpperCase()}</td>
                  <td>
                    <button
                      type="button"
                      className="tenant-open"
                      disabled={openingId === row.id}
                      onClick={() => openTenant(row.id)}
                    >
                      {openingId === row.id ? t.customers.opening : t.customers.open}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
