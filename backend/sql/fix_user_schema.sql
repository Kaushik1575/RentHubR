-- SQL to add missing columns to the users table

-- Add 'address' column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add 'phone_number' column if it doesn't exist (good practice to ensure)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add 'profile_photo' column if it doesn't exist (re-confirming)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Verify columns (optional, for output)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
