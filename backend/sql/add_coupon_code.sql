-- Add coupon_code column to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS coupon_code TEXT UNIQUE;

-- Generate unique codes for existing rewards (Backfill)
UPDATE rewards
SET coupon_code = 'RH-' || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 6))
WHERE coupon_code IS NULL;

-- Make it not null after backfill
ALTER TABLE rewards ALTER COLUMN coupon_code SET NOT NULL;
