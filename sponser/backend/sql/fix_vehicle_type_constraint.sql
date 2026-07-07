-- ============================================
-- PERMANENT FIX: Add database constraint to enforce singular vehicle types
-- ============================================
-- This ensures that future bookings can only use standardized vehicle types

-- Add check constraint to bookings table
ALTER TABLE bookings 
ADD CONSTRAINT check_vehicle_type_singular 
CHECK (vehicle_type IN ('bike', 'car', 'scooty', 'scooter'));

-- Note: 'scooter' is included as an alias for 'scooty' for compatibility
