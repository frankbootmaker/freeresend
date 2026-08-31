'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import { postAuthPath } from '@/lib/post-auth';

function OidcComplete() {
  const params = useSearchParams();
  const router = useRouter();
  const { completeOidc } = useAuth();
  const { t } = usePrefs();

  useEffect(() => {
    const oidcError = params.get('error');
    if (oidcError) {
      router.replace(`/login?oidc_error=${encodeURIComponent(oidcError)}`);
      return;
    }
    const token = params.get('token');
    if (!token) {
      router.replace('/login?oidc_error=failed');
      return;
    }
    completeOidc(token)
      .then((user) => router.replace(postAuthPath(user)))
      .catch(() => router.replace('/login?oidc_error=failed'));
  }, [completeOidc, params, router]);

  return (
    <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="muted">{t.loading}</p>
    </div>
  );
}

export default function LoginOidcPage() {
  return (
    <Suspense fallback={null}>
      <OidcComplete />
    </Suspense>
  );
}
