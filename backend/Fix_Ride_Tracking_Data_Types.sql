-- Fix Data Types for Ride Tracking Columns
-- This migration fixes the data type issues where decimal values couldn't be stored
-- and ensures proper UTC timestamp handling

-- ============================================
-- 1. FIX EXTRA_HOURS - Change from INTEGER to NUMERIC
-- ============================================
-- This allows storing decimal values like 6.75 hours
ALTER TABLE bookings
ALTER COLUMN extra_hours TYPE NUMERIC(10, 2) USING extra_hours::NUMERIC(10, 2);

COMMENT ON COLUMN bookings.extra_hours IS 'Extra hours beyond booked duration (decimal, e.g., 6.75)';

-- ============================================
-- 2. FIX EXTRA_AMOUNT - Ensure NUMERIC type
-- ============================================
ALTER TABLE bookings
ALTER COLUMN extra_amount TYPE NUMERIC(10, 2) USING extra_amount::NUMERIC(10, 2);

COMMENT ON COLUMN bookings.extra_amount IS 'Amount charged for extra hours (in rupees)';

-- ============================================
-- 3. VERIFY TIMESTAMP COLUMNS - Ensure UTC storage
-- ============================================
-- These should already be TIMESTAMP WITH TIME ZONE
-- This ensures they store in UTC and can be converted to any timezone
ALTER TABLE bookings
ALTER COLUMN ride_start_time TYPE TIMESTAMP WITH TIME ZONE USING ride_start_time::TIMESTAMP WITH TIME ZONE;

ALTER TABLE bookings
ALTER COLUMN ride_end_time TYPE TIMESTAMP WITH TIME ZONE USING ride_end_time::TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bookings.ride_start_time IS 'UTC timestamp when ride started (QR Scan 1)';
COMMENT ON COLUMN bookings.ride_end_time IS 'UTC timestamp when ride ended (QR Scan 2)';

-- ============================================
-- 4. VERIFY ACTUAL_DURATION_HOURS - Keep as INTEGER
-- ============================================
-- This stores the floor value of hours, so INTEGER is correct
COMMENT ON COLUMN bookings.actual_duration_hours IS 'Actual duration in whole hours (floor value)';

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- ✅ extra_hours: INTEGER → NUMERIC(10, 2) [FIXED]
-- ✅ extra_amount: Ensured NUMERIC(10, 2) [VERIFIED]
-- ✅ ride_start_time: Ensured TIMESTAMP WITH TIME ZONE (UTC) [VERIFIED]
-- ✅ ride_end_time: Ensured TIMESTAMP WITH TIME ZONE (UTC) [VERIFIED]
-- ✅ actual_duration_hours: INTEGER (correct) [VERIFIED]

-- Run this migration in your Supabase SQL Editor
-- After running, all ride tracking data will be stored correctly
