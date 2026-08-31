-- FreeResend multi-tenant schema (fresh install)

CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  billing_email VARCHAR(255),
  monthly_email_quota INTEGER DEFAULT 100000,
  inbound_transport VARCHAR(20) NOT NULL DEFAULT 'https',
  outbound_transport VARCHAR(20) NOT NULL DEFAULT 'ses',
  ses_config JSONB,
  smtp_upstream JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tenants_inbound_check CHECK (inbound_transport IN ('https', 'smtp', 'both')),
  CONSTRAINT tenants_transport_check CHECK (outbound_transport IN ('ses', 'smtp')),
  CONSTRAINT tenants_status_check CHECK (
    status IN ('pending_verification', 'active', 'suspended')
  )
);

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, user_id),
  CONSTRAINT membership_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE TABLE IF NOT EXISTS domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  ses_identity_arn VARCHAR(255),
  ses_configuration_set VARCHAR(255),
  do_domain_id VARCHAR(255),
  dns_records JSONB DEFAULT '[]',
  dns_checked_at TIMESTAMP WITH TIME ZONE,
  verification_token VARCHAR(255),
  dkim_selector VARCHAR(63),
  dkim_private_key TEXT,
  smtp_credentials JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(40) NOT NULL,
  permissions JSONB DEFAULT '["send"]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, key_name)
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  message_id VARCHAR(255),
  from_email VARCHAR(255) NOT NULL,
  to_emails JSONB NOT NULL,
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  attachments JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending',
  ses_message_id VARCHAR(255),
  error_message TEXT,
  channel VARCHAR(20) DEFAULT 'https',
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(40) NOT NULL,
  scopes JSONB DEFAULT '["read"]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  token_hash VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_tenant ON domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_created ON email_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_prefix ON mcp_tokens(key_prefix);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ses_region TEXT,
  ses_access_key_id TEXT,
  ses_secret_access_key TEXT,
  ses_configuration_set TEXT,
  smtp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure BOOLEAN NOT NULL DEFAULT TRUE,
  smtp_username TEXT,
  smtp_password TEXT,
  alert_email TEXT,
  alert_from TEXT,
  smtp_listen_ports TEXT,
  smtp_ingress_tls_mode TEXT DEFAULT 'off',
  smtp_ingress_tls_cert TEXT,
  smtp_ingress_tls_key TEXT,
  smtp_ingress_tls_source TEXT DEFAULT 'letsencrypt',
  smtp_ingress_tls_domain TEXT,
  smtp_ingress_acme_account_key TEXT,
  smtp_ingress_tls_expires_at TIMESTAMP WITH TIME ZONE,
  smtp_ingress_tls_renew_at TIMESTAMP WITH TIME ZONE,
  smtp_ingress_tls_status TEXT DEFAULT 'idle',
  smtp_ingress_tls_error TEXT,
  smtp_ingress_tls_status_at TIMESTAMP WITH TIME ZONE,
  smtp_ingress_acme_http_token TEXT,
  smtp_ingress_acme_http_key_auth TEXT,
  smtp_ingress_acme_challenge TEXT DEFAULT 'dns-manual',
  smtp_ingress_acme_dns_name TEXT,
  smtp_ingress_acme_dns_value TEXT,
  smtp_ingress_acme_order TEXT,
  smtp_ingress_ispconfig_url TEXT,
  smtp_ingress_ispconfig_user TEXT,
  smtp_ingress_ispconfig_password TEXT,
  smtp_ingress_ispconfig_insecure BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
