-- Fix payment-proofs storage policies to ensure signed URLs work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Buyers can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Buyers can view their payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage payment proofs" ON storage.objects;

-- Recreate policies with better logic

-- Policy: Authenticated users can upload payment proofs
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can view payment proofs for their own orders
CREATE POLICY "Users can view their payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND (
    -- Admins can see all
    public.is_admin(auth.uid())
    OR
    -- Buyers can see their own payment proofs
    EXISTS (
      SELECT 1 
      FROM public.orders o
      JOIN public.buyer_profiles bp ON o.buyer_id = bp.id
      WHERE bp.user_id = auth.uid()
      AND storage.objects.name LIKE o.id::text || '/%'
    )
    OR
    -- Couriers can see payment proofs for orders assigned to them
    EXISTS (
      SELECT 1 
      FROM public.orders o
      JOIN public.courier_profiles cp ON o.courier_id = cp.id
      WHERE cp.user_id = auth.uid()
      AND storage.objects.name LIKE o.id::text || '/%'
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

-- Policy: Users can delete their own payment proofs
CREATE POLICY "Users can delete their payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs'
  AND (
    public.is_admin(auth.uid())
    OR
    EXISTS (
      SELECT 1 
      FROM public.orders o
      JOIN public.buyer_profiles bp ON o.buyer_id = bp.id
      WHERE bp.user_id = auth.uid()
      AND storage.objects.name LIKE o.id::text || '/%'
    )
  )
);
