-- Add missing columns to bookings table for refund tracking

-- Add refund_id column (stores Razorpay refund ID)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255) DEFAULT NULL;

-- Add advance_payment column (stores 30% advance payment amount)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(10, 2) DEFAULT NULL;

-- Add total_amount column (stores full booking amount)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT NULL;

-- Add refund_timestamp column (when refund was processed)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_timestamp TIMESTAMP DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bookings.refund_id IS 'Razorpay refund ID (e.g., rfnd_xxxxx)';
COMMENT ON COLUMN bookings.advance_payment IS '30% advance payment amount in rupees';
COMMENT ON COLUMN bookings.total_amount IS 'Total booking amount in rupees';
COMMENT ON COLUMN bookings.refund_timestamp IS 'Timestamp when refund was completed';

-- Update existing bookings to set advance_payment from total_amount if possible
-- This is a one-time fix for old bookings
UPDATE bookings 
SET advance_payment = CASE 
    WHEN total_amount IS NOT NULL THEN ROUND(total_amount * 0.3, 2)
    ELSE 100 
END
WHERE advance_payment IS NULL 
  AND status IN ('confirmed', 'cancelled', 'rejected');
