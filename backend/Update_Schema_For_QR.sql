-- Add columns for Ride Start/End and Extra Charges
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ride_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ride_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_duration_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_amount NUMERIC DEFAULT 0;

-- Optional: Add comments for clarity
COMMENT ON COLUMN bookings.ride_start_time IS 'Timestamp when the ride started (QR Scan 1)';
COMMENT ON COLUMN bookings.ride_end_time IS 'Timestamp when the ride ended (QR Scan 2)';
COMMENT ON COLUMN bookings.actual_duration_hours IS 'Actual duration in hours (floor value)';
COMMENT ON COLUMN bookings.extra_hours IS 'Number of extra hours used beyond booked duration';
COMMENT ON COLUMN bookings.extra_amount IS 'Amount calculated for extra hours';
