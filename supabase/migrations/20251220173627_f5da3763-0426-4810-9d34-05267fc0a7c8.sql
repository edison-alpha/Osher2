-- Create storage bucket for delivery proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow couriers to upload delivery proof photos
CREATE POLICY "Couriers can upload delivery proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'delivery-proofs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM courier_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow anyone to view delivery proof photos
CREATE POLICY "Anyone can view delivery proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-proofs');

-- Allow couriers to update their own uploads
CREATE POLICY "Couriers can update their delivery proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'delivery-proofs'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM courier_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow couriers to delete their own uploads
CREATE POLICY "Couriers can delete their delivery proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'delivery-proofs'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM courier_profiles 
    WHERE user_id = auth.uid()
  )
);