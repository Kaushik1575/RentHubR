-- Add Missing Columns to Bookings Table
-- Run this migration to fix the "remaining_amount column not found" error

-- ============================================
-- 1. ADD REMAINING_AMOUNT COLUMN
-- ============================================
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN bookings.remaining_amount IS 'Remaining amount to be paid after advance payment';

-- ============================================
-- 2. FIX EXTRA_HOURS - Change from INTEGER to NUMERIC
-- ============================================
-- Check if column exists and alter type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'extra_hours'
    ) THEN
        ALTER TABLE bookings
        ALTER COLUMN extra_hours TYPE NUMERIC(10, 2) USING extra_hours::NUMERIC(10, 2);
    ELSE
        ALTER TABLE bookings
        ADD COLUMN extra_hours NUMERIC(10, 2) DEFAULT 0;
    END IF;
END $$;

COMMENT ON COLUMN bookings.extra_hours IS 'Extra hours beyond booked duration (decimal, e.g., 6.75)';

-- ============================================
-- 3. ENSURE OTHER RIDE TRACKING COLUMNS EXIST
-- ============================================
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ride_start_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ride_end_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS actual_duration_hours INTEGER DEFAULT 0;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS extra_amount NUMERIC(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN bookings.ride_start_time IS 'Timestamp when ride started (QR Scan 1)';
COMMENT ON COLUMN bookings.ride_end_time IS 'Timestamp when ride ended (QR Scan 2)';
COMMENT ON COLUMN bookings.actual_duration_hours IS 'Actual duration in whole hours (floor value)';
COMMENT ON COLUMN bookings.extra_amount IS 'Amount charged for extra hours (in rupees)';

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ remaining_amount: Added as NUMERIC(10, 2)
-- ✅ extra_hours: Changed to NUMERIC(10, 2) to support decimals
-- ✅ ride_start_time: Ensured exists as TIMESTAMP WITH TIME ZONE
-- ✅ ride_end_time: Ensured exists as TIMESTAMP WITH TIME ZONE
-- ✅ actual_duration_hours: Ensured exists as INTEGER
-- ✅ extra_amount: Ensured exists as NUMERIC(10, 2)

-- Run this in Supabase SQL Editor to fix all missing columns
