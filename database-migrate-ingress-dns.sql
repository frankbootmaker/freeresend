-- Apply to existing OutPost databases created before ingress + DNS checks.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS inbound_transport VARCHAR(20) NOT NULL DEFAULT 'https';

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_inbound_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_inbound_check
  CHECK (inbound_transport IN ('https', 'smtp', 'both'));

ALTER TABLE domains ADD COLUMN IF NOT EXISTS dns_checked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS dkim_selector VARCHAR(63);
ALTER TABLE domains ADD COLUMN IF NOT EXISTS dkim_private_key TEXT;
