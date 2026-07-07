-- ============================================
-- SQL TO REMOVE APPROVAL WORKFLOW
-- ============================================

-- 1. Drop is_approved column from sponsors table
ALTER TABLE IF EXISTS public.sponsors 
DROP COLUMN IF EXISTS is_approved;

-- 2. Update RLS policies to remove approval check on vehicles
-- (Previously: USING (is_available = true AND is_approved = true))
DROP POLICY IF EXISTS "Public can view available bikes" ON public.bikes;

CREATE POLICY "Public can view available bikes"
ON public.bikes FOR SELECT
USING (is_available = true);
-- Note: You might want to keep approval for vehicles, but if you want total freedom:
-- We removed 'AND is_approved = true' from the condition.

-- 3. (Optional) If you also want to remove vehicle approval column:
-- ALTER TABLE public.bikes DROP COLUMN IF EXISTS is_approved;
-- (I am leaving it for now in case you want to moderate vehicles properly)
