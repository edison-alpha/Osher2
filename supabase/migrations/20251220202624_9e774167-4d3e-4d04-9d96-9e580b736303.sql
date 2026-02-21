-- Fix: Make payment-proofs bucket private and fix RLS policies

-- 1. Set the payment-proofs bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- 2. Drop existing storage policies for payment-proofs bucket
DROP POLICY IF EXISTS "Buyers can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Buyers can view their payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;

-- 3. Create proper RLS policies for payment-proofs bucket

-- Policy: Buyers can upload payment proofs for their own orders
CREATE POLICY "Buyers can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

-- Policy: Buyers can view their own payment proofs (order-scoped) and admins can see all
CREATE POLICY "Buyers can view their payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND (
    -- Admins can see all
    public.is_admin(auth.uid())
    OR
    -- Order owners can see their proofs
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.buyer_profiles bp ON o.buyer_id = bp.id
      WHERE bp.user_id = auth.uid()
      AND name LIKE o.id::text || '/%'
    )
  )
);

-- Policy: Admins can manage all payment proofs
CREATE POLICY "Admins can manage payment proofs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'payment-proofs'
  AND public.is_admin(auth.uid())
);