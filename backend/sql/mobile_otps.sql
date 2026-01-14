-- Create table for storing Mobile OTPs
create table public.mobile_otps (
  id uuid default gen_random_uuid() primary key,
  phone_number text not null,
  otp text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Optional, depending on your setup)
alter table public.mobile_otps enable row level security;

-- Create policy to allow insert/select (adjust as needed for your app's security model)
-- For now, allowing service role access is handled by backend key.
-- If you need public access (not recommended), you'd add policies here.
