ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS hourly_email_quota INTEGER NOT NULL DEFAULT 5000;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS daily_email_quota INTEGER NOT NULL DEFAULT 20000;

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_hourly_quota_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_hourly_quota_check CHECK (hourly_email_quota > 0);

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_daily_quota_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_daily_quota_check CHECK (daily_email_quota > 0);

CREATE TABLE IF NOT EXISTS suppressed_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reason VARCHAR(20) NOT NULL,
  bounce_type VARCHAR(40),
  email_log_id UUID REFERENCES email_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, email),
  CONSTRAINT suppressed_reason_check CHECK (reason IN ('bounce', 'complaint', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_suppressed_recipients_tenant
  ON suppressed_recipients (tenant_id, created_at DESC);
