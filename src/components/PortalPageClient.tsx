'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import PortalDashboard from '@/components/PortalDashboard';

export default function PortalPageClient() {
  const { user, loading } = useAuth();
  const { t } = usePrefs();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/');
      return;
    }
    if (!user.isPlatformAdmin) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="shell"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p className="muted">{t.loading}</p>
      </div>
    );
  }

  if (!user?.isPlatformAdmin) {
    return null;
  }

  return <PortalDashboard />;
}
