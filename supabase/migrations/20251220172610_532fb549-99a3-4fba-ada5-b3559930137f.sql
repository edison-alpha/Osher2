-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add orders to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for payment_confirmations table
ALTER TABLE public.payment_confirmations REPLICA IDENTITY FULL;

-- Add payment_confirmations to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_confirmations;