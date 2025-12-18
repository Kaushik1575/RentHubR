-- Add reminder tracking columns to bookings table

-- Add reminder_sent column (boolean, default false)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Add reminder_sent_at column (timestamp)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN bookings.reminder_sent IS 'Indicates if 2-hour pickup reminder email has been sent';
COMMENT ON COLUMN bookings.reminder_sent_at IS 'Timestamp when the reminder email was sent';

-- Create index for faster queries when checking for reminders
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_check 
ON bookings(status, reminder_sent, start_date, start_time) 
WHERE status = 'confirmed' AND (reminder_sent IS NULL OR reminder_sent = FALSE);
