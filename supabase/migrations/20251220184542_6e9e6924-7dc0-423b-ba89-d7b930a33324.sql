-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND is_admin(auth.uid()));

-- Fix system_settings: ensure all required keys exist with correct names
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('admin_bank_name', 'BCA', 'Nama bank untuk pembayaran'),
  ('admin_bank_account', '1234567890', 'Nomor rekening untuk pembayaran'),
  ('admin_bank_holder', 'PT. Example Store', 'Nama pemilik rekening')
ON CONFLICT (key) DO NOTHING;