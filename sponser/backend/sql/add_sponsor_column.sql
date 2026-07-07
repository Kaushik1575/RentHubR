-- Add sponsor_id column to existing vehicle tables
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.sponsors(id);
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.sponsors(id);
ALTER TABLE public.scooty ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.sponsors(id);

-- Also add is_approved and is_available if missing (to match logic)
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE public.scooty ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.scooty ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
