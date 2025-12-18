-- Run this in Supabase SQL Editor to check if migration was done

-- Check if columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('reminder_sent', 'reminder_sent_at');

-- If you see 2 rows, migration is done ✅
-- If you see 0 rows, run the migration below:

/*
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_check 
ON bookings(status, reminder_sent, start_date, start_time) 
WHERE status = 'confirmed' AND (reminder_sent IS NULL OR reminder_sent = FALSE);
*/
