'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import CustomersTab from './CustomersTab';
import AppShell from './AppShell';

export default function PortalDashboard() {
  const router = useRouter();
  const { tenant, logout } = useAuth();
  const { t } = usePrefs();
  const tenantLabel = tenant?.name
    ? t.nav.backToTenant(tenant.name)
    : t.nav.backToConsole;

  return (
    <AppShell
      portal
      crumb={t.nav.platformCrumb}
      title={t.nav.customers}
      items={[{ id: 'customers', label: t.nav.customers }]}
      activeId="customers"
      onSelect={() => undefined}
      tenantLabel={tenantLabel}
      onTenantSwitch={() => router.push('/')}
      onSignOut={logout}
    >
      <CustomersTab />
    </AppShell>
  );
}
