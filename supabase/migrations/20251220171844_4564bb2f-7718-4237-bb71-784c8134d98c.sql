-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true);

-- Create RLS policies for payment proofs bucket
-- Allow buyers to upload their own payment proofs
CREATE POLICY "Buyers can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid() IS NOT NULL
);

-- Allow buyers to view their own payment proofs
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow buyers to update their own payment proofs
CREATE POLICY "Buyers can update their payment proofs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

-- Allow buyers to delete their own payment proofs
CREATE POLICY "Buyers can delete their payment proofs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);