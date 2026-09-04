'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import DomainsTab from './DomainsTab';
import ApiKeysTab from './ApiKeysTab';
import AgentsTab from './AgentsTab';
import EmailLogsTab from './EmailLogsTab';
import SendingTab from './SendingTab';
import GuideTab from './GuideTab';
import OrganizationTab from './OrganizationTab';
import AbuseTab from './AbuseTab';
import AppShell, { type ShellNavItem } from './AppShell';

type Tab =
  | 'sending'
  | 'domains'
  | 'apikeys'
  | 'agents'
  | 'logs'
  | 'abuse'
  | 'organization'
  | 'guide';

export default function Dashboard() {
  const router = useRouter();
  const { user, tenant, memberships, switchTenant, logout } = useAuth();
  const { t } = usePrefs();
  const [activeTab, setActiveTab] = useState<Tab>('sending');

  const tabLabels: Record<Tab, string> = {
    sending: t.nav.sending,
    domains: t.nav.domains,
    apikeys: t.nav.apiKeys,
    agents: t.nav.agents,
    logs: t.nav.logs,
    abuse: t.nav.abuse,
    organization: t.nav.organization,
    guide: t.nav.guide,
  };

  const items: ShellNavItem[] = [
    { id: 'sending', label: tabLabels.sending },
    { id: 'domains', label: tabLabels.domains },
    { id: 'apikeys', label: tabLabels.apikeys },
    { id: 'agents', label: tabLabels.agents },
    { id: 'logs', label: tabLabels.logs },
    { id: 'abuse', label: tabLabels.abuse },
    { id: 'organization', label: tabLabels.organization },
    { id: 'guide', label: tabLabels.guide },
  ];

  const tenantName = tenant?.name || t.nav.tenantFallback;
  const crumb = tenantName;

  return (
    <AppShell
      crumb={crumb}
      title={tabLabels[activeTab]}
      items={items}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as Tab)}
      tenantLabel={`${tenantName} ▾`}
      onTenantSwitch={() => {
        if (memberships.length > 1) {
          const index = memberships.findIndex(
            (m) => m.tenant_id === (tenant?.id || user?.tenantId),
          );
          const next = memberships[(index + 1) % memberships.length];
          switchTenant(next.tenant_id);
        }
      }}
      onPortalSwitch={
        user?.isPlatformAdmin ? () => router.push('/portal') : undefined
      }
      onSignOut={logout}
    >
      {activeTab === 'sending' && <SendingTab />}
      {activeTab === 'domains' && <DomainsTab />}
      {activeTab === 'apikeys' && <ApiKeysTab />}
      {activeTab === 'agents' && <AgentsTab kind="tenant" />}
      {activeTab === 'logs' && <EmailLogsTab />}
      {activeTab === 'abuse' && <AbuseTab />}
      {activeTab === 'organization' && <OrganizationTab />}
      {activeTab === 'guide' && <GuideTab kind="tenant" />}
    </AppShell>
  );
}
