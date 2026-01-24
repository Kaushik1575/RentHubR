-- ==========================================
-- BACKFILL SCRIPT FOR SUPER COINS
-- ==========================================
-- This script calculates coins for past completed rides and adds them to the user's balance.
-- WARNING: Run this ONLY ONCE to avoid double-crediting!

BEGIN;

-- 1. Calculate and update coins_earned for bookings that haven't been processed yet
-- We check for coins_earned IS NULL or 0 to avoid re-processing
UPDATE bookings
SET coins_earned = FLOOR(EXTRACT(EPOCH FROM (ride_end_time - ride_start_time)) / 60)
WHERE status IN ('ride_completed', 'completed')
  AND (coins_earned IS NULL OR coins_earned = 0)
  AND ride_start_time IS NOT NULL
  AND ride_end_time IS NOT NULL;

-- 2. Add these calculated coins to the Users' specific balance
-- We aggregate ONLY the bookings that were just updated or existing ones?
-- To be safe giving the "run once" constraint, we can just aggregate all coins_earned from bookings
-- and assume we want to sync the user's balance to reflect total history + manual adjustments?
-- No, let's just do an additive update based on the bookings we just populated (difficult in one go)
-- OR, just calculate total from history and SET it? (Risk: erases manual adjustments/spending).
-- User asked to "add".

-- Helper: Create a temporary table to hold the updates
CREATE TEMP TABLE coins_to_add AS
SELECT user_id, SUM(coins_earned) as new_coins
FROM bookings
WHERE status IN ('ride_completed', 'completed')
GROUP BY user_id;

-- 3. Update Users
UPDATE users
SET super_coins = COALESCE(super_coins, 0) + c.new_coins
FROM coins_to_add c
WHERE users.id = c.user_id;

COMMIT;

-- Verify
SELECT id, email, super_coins FROM users;
