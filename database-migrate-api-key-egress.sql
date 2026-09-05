ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS egress_preference VARCHAR(10) NOT NULL DEFAULT 'auto';

ALTER TABLE api_keys
  DROP CONSTRAINT IF EXISTS api_keys_egress_preference_check;
ALTER TABLE api_keys
  ADD CONSTRAINT api_keys_egress_preference_check
  CHECK (egress_preference IN ('auto', 'ses', 'smtp'));
