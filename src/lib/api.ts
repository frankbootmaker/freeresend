const API_BASE = '/api';

function toQuery(
  params: Record<string, string | number | undefined | null> = {},
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

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
    acceptedTerms: boolean;
    acceptedTermsVersion: string;
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

  async getOidcStatus() {
    return this.request("/auth/oidc");
  }

  async forgotPassword(email: string, locale?: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, locale }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  async updateProfile(payload: {
    name?: string;
    avatar?: string | null;
    locale?: string;
  }) {
    const response = await this.request("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
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

  async deleteCurrentTenant(confirmName: string) {
    return this.request('/tenant', {
      method: 'DELETE',
      body: JSON.stringify({ confirmName }),
    });
  }

  async requestByoSes() {
    return this.request('/tenant/ses-byo-request', { method: 'POST' });
  }

  async updateTenantSending(payload: {
    inboundTransport?: "https" | "smtp" | "both";
    outboundTransport?: "ses" | "smtp";
    sesMode?: "platform" | "byo";
    sesConfig?: {
      region?: string;
      configurationSet?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
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

  async getTenantAbuse() {
    return this.request('/tenant/abuse');
  }

  async listPlatformAbuse(params: {
    page?: number;
    limit?: number;
    open?: boolean;
  } = {}) {
    return this.request(`/admin/abuse${toQuery({
      page: params.page,
      limit: params.limit,
      open: params.open ? '1' : undefined,
    })}`);
  }

  async listCustomers(params: {
    page?: number;
    limit?: number;
    q?: string;
    byo?: 'requested' | 'approved';
  } = {}) {
    return this.request(`/admin/customers${toQuery(params)}`);
  }

  async createCustomer(payload: Record<string, unknown>) {
    return this.request("/admin/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listPlatformUsers(
    params: { page?: number; limit?: number; q?: string } = {},
  ) {
    return this.request(`/admin/users${toQuery(params)}`);
  }

  async createPlatformUser(payload: {
    email: string;
    name?: string;
    password?: string;
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePlatformUser(
    id: string,
    payload: { name?: string; password?: string },
  ) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async revokePlatformUser(id: string) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  async deletePlatformUser(id: string) {
    return this.request(`/admin/users/${id}?purge=1`, { method: 'DELETE' });
  }

  async updateCustomer(id: string, payload: {
    name?: string;
    sesByoAllowed?: boolean;
    sesByoDecision?: 'approve' | 'deny';
    sendingTier?: 'probation' | 'shared' | 'byo' | 'dedicated';
    billingMode?: 'exempt' | 'invoiced';
    hourlyEmailQuota?: number;
    dailyEmailQuota?: number;
    monthlyEmailQuota?: number;
    sendingFrozen?: false;
  }) {
    return this.request(`/admin/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/admin/customers/${id}`, { method: 'DELETE' });
  }

  async listPlatformAgents(params: { page?: number; limit?: number } = {}) {
    return this.request(`/admin/agents${toQuery(params)}`);
  }

  async createPlatformAgent(name: string) {
    return this.request('/admin/agents', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async revokePlatformAgent(id: string) {
    return this.request(`/admin/agents/${id}`, { method: 'DELETE' });
  }

  async listTenantAgents(params: { page?: number; limit?: number } = {}) {
    return this.request(`/agents${toQuery(params)}`);
  }

  async createTenantAgent(name: string) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async revokeTenantAgent(id: string) {
    return this.request(`/agents/${id}`, { method: 'DELETE' });
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

  async getSystemDomain() {
    return this.request('/admin/settings/system-domain');
  }

  async attachSystemDomain(payload: { useWebHost?: boolean; domain?: string }) {
    return this.request('/admin/settings/system-domain', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async saveSystemDomainFrom(localPart: string) {
    return this.request('/admin/settings/system-domain', {
      method: 'PATCH',
      body: JSON.stringify({ localPart }),
    });
  }

  async verifySystemDomain() {
    return this.request('/admin/settings/system-domain/verify', {
      method: 'POST',
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
    locale?: string;
  }) {
    return this.request('/admin/settings/test-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Domains
  async getDomains() {
    return this.request('/domains');
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
  async getApiKeys(params: { page?: number; limit?: number } = {}) {
    return this.request(`/api-keys${toQuery(params)}`);
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
      q?: string;
      from?: string;
    } = {},
  ) {
    return this.request(`/emails/logs${toQuery(params)}`);
  }

  async getEmail(id: string) {
    return this.request(`/emails/${id}`);
  }

  async getPlatformLogs(
    params: Record<string, string | number | undefined> = {},
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const query = searchParams.toString();
    return this.request(`/admin/logs${query ? `?${query}` : ''}`);
  }

  async getPlatformLog(id: string) {
    return this.request(`/admin/logs/${id}`);
  }

  async getLogRetention() {
    return this.request('/admin/logs/retention');
  }

  async updateLogRetention(payload: {
    keepDays: number;
    stripBodyDays: number;
  }) {
    return this.request('/admin/logs/retention', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async rotatePlatformLogs() {
    return this.request('/admin/logs/rotate', { method: 'POST' });
  }

  async downloadOpsExport(days = 7) {
    await this.downloadBlob(
      `/admin/logs/ops-export?days=${days}`,
      `relayhorizon-ops-log-${days}d.json`,
    );
  }

  async getBackups() {
    return this.request('/admin/backups');
  }

  async exportBackup() {
    return this.request('/admin/backups/export', { method: 'POST' });
  }

  async downloadBackup(name: string) {
    await this.downloadBlob(
      `/admin/backups/${encodeURIComponent(name)}`,
      name,
    );
  }

  async deleteBackup(name: string) {
    return this.request(`/admin/backups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async importBackup(file: File, confirm: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('confirm', confirm);
    return this.requestForm('/admin/backups/import', form);
  }

  async updateBackupSchedule(payload: {
    enabled: boolean;
    intervalSeconds: number;
  }) {
    return this.request('/admin/backups/schedule', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateBackupRetention(payload: {
    keepDaily: number;
    keepWeekly: number;
    keepMonthly: number;
    autoRotate: boolean;
  }) {
    return this.request('/admin/backups/retention', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateBackupOffsite(payload: Record<string, unknown>) {
    return this.request('/admin/backups/offsite', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async testBackupOffsite() {
    return this.request('/admin/backups/offsite/test', { method: 'POST' });
  }

  async pushBackupOffsite(name?: string) {
    return this.request('/admin/backups/offsite/push', {
      method: 'POST',
      body: JSON.stringify(name ? { name } : {}),
    });
  }

  private authHeaders(json = true): Record<string, string> {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (this.tenantId) headers['X-Tenant-Id'] = this.tenantId;
    return headers;
  }

  private async requestForm(endpoint: string, form: FormData) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.authHeaders(false),
      body: form,
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  private async downloadBlob(endpoint: string, filename: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: this.authHeaders(false),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Download failed');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();
