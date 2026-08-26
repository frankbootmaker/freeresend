"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePrefs } from "@/contexts/PrefsContext";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = usePrefs();

  if (loading) {
    return (
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="muted">{t.loading}</p>
      </div>
    );
  }

  // Show dashboard if user is authenticated
  if (user) {
    return <Dashboard />;
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
