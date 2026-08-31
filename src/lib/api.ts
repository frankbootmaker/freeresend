const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
      this.tenantId = localStorage.getItem("tenant_id");
    }
  }

  setTenantId(id: string | null) {
    this.tenantId = id;
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("tenant_id", id);
      else localStorage.removeItem("tenant_id");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    if (this.tenantId) {
      headers['X-Tenant-Id'] = this.tenantId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
      this.setTenantId(response.data.user?.tenantId || null);
    }

    return response;
  }

  async register(payload: {
    name: string;
    slug?: string;
    email: string;
    password: string;
  }) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
      this.setTenantId(response.data.user?.tenantId || null);
    }
    return response;
  }

  async getUser() {
    return this.request("/auth/me");
  }

  async switchTenant(tenantId: string) {
    const response = await this.request("/auth/me", {
      method: "POST",
      body: JSON.stringify({ tenantId }),
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
      this.setTenantId(response.data.user?.tenantId || tenantId);
    }
    return response;
  }

  async getTenant() {
    return this.request("/tenant");
  }

  async updateTenantSending(payload: {
    inboundTransport?: "https" | "smtp" | "both";
    outboundTransport?: "ses" | "smtp";
    smtpUpstream?: {
      host: string;
      port: number;
      secure?: boolean;
      username?: string;
      password?: string;
    } | null;
  }) {
    return this.request("/tenant", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async getTenantStats(days = 30) {
    return this.request(`/stats/tenant?days=${days}`);
  }

  async listCustomers() {
    return this.request("/admin/customers");
  }

  async createCustomer(payload: Record<string, unknown>) {
    return this.request("/admin/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPlatformSettings() {
    return this.request("/admin/settings");
  }

  async updatePlatformSettings(payload: Record<string, unknown>) {
    return this.request("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async getPlatformHealth() {
    return this.request('/admin/health');
  }

  async issuePlatformCertificate(action: 'issue' | 'continue' = 'issue') {
    return this.request('/admin/settings/certificate', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async sendPlatformTestEmail(payload: {
    from: string;
    to: string;
    via: 'ses' | 'smtp';
  }) {
    return this.request('/admin/settings/test-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Domains
  async getDomains() {
    return this.request("/domains");
  }

  async addDomain(domain: string) {
    return this.request("/domains", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  async deleteDomain(id: string) {
    return this.request(`/domains/${id}`, {
      method: "DELETE",
    });
  }

  async verifyDomain(id: string) {
    return this.request(`/domains/${id}/verify`, {
      method: "POST",
    });
  }

  async retryDigitalOceanDNS(id: string) {
    return this.request(`/domains/${id}/retry-dns`, {
      method: "POST",
    });
  }

  // API Keys
  async getApiKeys() {
    return this.request("/api-keys");
  }

  async createApiKey(
    domainId: string,
    keyName: string,
    permissions: string[] = ["send"]
  ) {
    return this.request("/api-keys", {
      method: "POST",
      body: JSON.stringify({ domainId, keyName, permissions }),
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/api-keys/${id}`, {
      method: "DELETE",
    });
  }

  // Email Logs
  async getEmailLogs(
    params: {
      page?: number;
      limit?: number;
      domain_id?: string;
      status?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const query = searchParams.toString();
    return this.request(`/emails/logs${query ? `?${query}` : ""}`);
  }

  async getEmail(id: string) {
    return this.request(`/emails/${id}`);
  }
}

export const api = new ApiClient();
