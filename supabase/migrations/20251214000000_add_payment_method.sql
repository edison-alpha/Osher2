-- Add payment_method enum type
CREATE TYPE public.payment_method AS ENUM ('transfer', 'cod', 'commission');

-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_method payment_method NOT NULL DEFAULT 'transfer';

-- Add comment
COMMENT ON COLUMN public.orders.payment_method IS 'Metode pembayaran: transfer (Transfer Bank), cod (Cash on Delivery), commission (Saldo Komisi)';
