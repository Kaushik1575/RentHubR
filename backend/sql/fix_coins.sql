-- Clean up coins for No-Show bookings
UPDATE bookings 
SET coins_earned = 0 
WHERE status = 'rider_not_come';
