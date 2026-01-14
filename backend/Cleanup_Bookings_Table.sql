-- Cleanup Unnecessary Columns from Bookings Table

ALTER TABLE bookings
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS rejection_timestamp,
DROP COLUMN IF EXISTS refund_completed_at,
DROP COLUMN IF EXISTS refund_completion_timestamp;

-- Note: 
-- rejection_reason/timestamp are dropped as 'Rejection' concept is removed.
-- refund_id, refund_details, refund_amount, refund_status are KEPT.
