"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePrefs } from "@/contexts/PrefsContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "@/components/LoginForm";
import { postAuthPath } from "@/lib/post-auth";

export default function LoginPageClient() {
  const { user, loading } = useAuth();
  const { t } = usePrefs();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(postAuthPath(user));
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="muted">{t.loading}</p>
      </div>
    );
  }

  // Don't show login form if user is authenticated (they'll be redirected)
  if (user) {
    return null;
  }

  return <LoginForm />;
}