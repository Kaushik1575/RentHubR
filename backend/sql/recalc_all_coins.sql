-- Recalculate coins for ALL completed rides based on actual duration (1 coin per minute)
-- This fixes any past calculations that might have been incorrect (e.g. 540 coins vs 590 mins)

UPDATE bookings
SET coins_earned = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (ride_end_time::timestamp - ride_start_time::timestamp)) / 60))
WHERE status IN ('ride_completed', 'completed')
  AND ride_end_time IS NOT NULL
  AND ride_start_time IS NOT NULL;
