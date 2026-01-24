-- Super Coins Loyalty System Migration

-- 1. Extend users table with super_coins
ALTER TABLE users ADD COLUMN IF NOT EXISTS super_coins INT DEFAULT 0;

-- 2. Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type TEXT DEFAULT 'FREE_2_HOUR_RIDE' NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 3. Create loyalty_settings table
CREATE TABLE IF NOT EXISTS loyalty_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert default settings
INSERT INTO loyalty_settings (key, value) VALUES
('earning_rate', '1'), -- 1 coin per 1 minute
('reward_threshold', '1000'), -- 1000 coins for a reward
('system_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- 4. Extend bookings table to track loyalty info
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coins_earned INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reward_id BIGINT REFERENCES rewards(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_free_ride BOOLEAN DEFAULT FALSE;
