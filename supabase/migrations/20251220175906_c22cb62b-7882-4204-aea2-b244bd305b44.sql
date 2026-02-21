-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active banks" ON public.banks;
DROP POLICY IF EXISTS "Anyone can view active domiciles" ON public.domiciles;

-- Create new policies for public read access (no auth required for registration)
CREATE POLICY "Public can view active banks" 
ON public.banks FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public can view active domiciles" 
ON public.domiciles FOR SELECT 
USING (is_active = true);