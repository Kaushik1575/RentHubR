-- Run this command in your Supabase User Interface SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;
