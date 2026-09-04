ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS sending_tier VARCHAR(20) NOT NULL DEFAULT 'probation';

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NOT NULL DEFAULT 'exempt';

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_sending_tier_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_sending_tier_check
  CHECK (sending_tier IN ('probation', 'shared', 'byo', 'dedicated'));

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_billing_mode_check;
ALTER TABLE tenants
  ADD CONSTRAINT tenants_billing_mode_check
  CHECK (billing_mode IN ('exempt', 'invoiced'));
