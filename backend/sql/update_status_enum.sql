-- Run this in your Supabase SQL Editor to allow the 'rider_not_come' status

-- 1. Drop the existing constraint that limits status values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_status;

-- 2. Add the new constraint including 'rider_not_come'
ALTER TABLE bookings ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'confirmed', 'ride_started', 'ride_completed', 'cancelled', 'completed', 'rider_not_come'));

-- 3. (Optional) Verify it works by selecting from bookings
-- SELECT * FROM bookings LIMIT 5;
