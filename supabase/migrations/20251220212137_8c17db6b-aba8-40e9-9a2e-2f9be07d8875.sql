-- Fix RLS policies for buyer_profiles to allow admins to view all buyers
-- The issue is that restrictive policies use AND logic, causing the admin view to fail

-- Drop the existing restrictive admin view policy
DROP POLICY IF EXISTS "Admins can view all buyer profiles" ON public.buyer_profiles;

-- Recreate as a PERMISSIVE policy (default) so it uses OR logic with other SELECT policies
CREATE POLICY "Admins can view all buyer profiles"
ON public.buyer_profiles
FOR SELECT
USING (public.is_admin(auth.uid()));