'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import CustomersTab from './CustomersTab';
import PlatformSettingsTab from './PlatformSettingsTab';
import AppShell, { type ShellNavItem } from './AppShell';

type Tab = 'customers' | 'settings';

export default function PortalDashboard() {
  const router = useRouter();
  const { tenant, logout } = useAuth();
  const { t } = usePrefs();
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const tenantLabel = tenant?.name
    ? t.nav.backToTenant(tenant.name)
    : t.nav.backToConsole;

  const tabLabels: Record<Tab, string> = {
    customers: t.nav.customers,
    settings: t.nav.settings,
  };

  const items: ShellNavItem[] = [
    { id: 'customers', label: tabLabels.customers },
    { id: 'settings', label: tabLabels.settings },
  ];

  return (
    <AppShell
      portal
      crumb={t.nav.platformCrumb}
      title={tabLabels[activeTab]}
      items={items}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as Tab)}
      tenantLabel={tenantLabel}
      onTenantSwitch={() => router.push('/')}
      onSignOut={logout}
    >
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'settings' && <PlatformSettingsTab />}
    </AppShell>
  );
}
