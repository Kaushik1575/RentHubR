-- Fix rewards table schema: user_id should be BIGINT (Integer), not UUID
-- This fixes the "invalid input syntax for type uuid: '43'" error.

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_user_id_fkey;

-- 2. Change user_id column type from UUID to BIGINT
-- We use "USING NULL" because existing UUIDs cannot be converted to Integers. 
-- This will clear invalid user_id data, but since the feature was broken, it likely contains no valid integer data yet.
ALTER TABLE rewards ALTER COLUMN user_id TYPE BIGINT USING NULL;

-- 3. Add the correct foreign key constraint pointing to the public.users table
ALTER TABLE rewards ADD CONSTRAINT rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
