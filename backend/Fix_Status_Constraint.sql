-- Drop the existing check constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS valid_status;

-- Add the new check constraint with updated status values
ALTER TABLE bookings
ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected', 'ride_started', 'ride_completed', 'completed'));
