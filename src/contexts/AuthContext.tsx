"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string | null;
  isPlatformAdmin?: boolean;
  tenantId?: string;
  membershipRole?: string;
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export interface Membership {
  tenant_id: string;
  slug: string;
  tenant_name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: TenantSummary | null;
  memberships: Membership[];
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    slug?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    avatar?: string | null;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const applySession = (data: {
    user?: AuthUser;
    tenant?: TenantSummary;
    memberships?: Membership[];
  }) => {
    setUser(data.user || null);
    setTenant(data.tenant || null);
    setMemberships(data.memberships || []);
    if (data.user?.tenantId) {
      api.setTenantId(data.user.tenantId);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.getUser();
      applySession(response.data);
    } catch {
      api.clearToken();
      api.setTenantId(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    applySession(response.data);
    return response.data.user as AuthUser;
  };

  const register = async (payload: {
    name: string;
    slug?: string;
    email: string;
    password: string;
  }) => {
    const response = await api.register(payload);
    applySession(response.data);
  };

  const switchTenant = async (tenantId: string) => {
    const response = await api.switchTenant(tenantId);
    applySession({
      user: response.data.user,
      tenant: response.data.tenant,
      memberships: response.data.memberships,
    });
  };

  const updateProfile = async (payload: {
    name?: string;
    avatar?: string | null;
  }) => {
    const response = await api.updateProfile(payload);
    applySession({
      user: response.data.user,
      tenant: response.data.tenant ?? tenant,
      memberships: response.data.memberships ?? memberships,
    });
  };

  const logout = () => {
    api.clearToken();
    api.setTenantId(null);
    setUser(null);
    setTenant(null);
    setMemberships([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        memberships,
        loading,
        login,
        register,
        switchTenant,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
