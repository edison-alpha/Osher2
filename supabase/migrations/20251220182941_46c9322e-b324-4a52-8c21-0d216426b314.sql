-- ===========================================
-- PHASE 1: PRODUCTION-READY CRITICAL FIXES
-- ===========================================

-- 1. ADD REFERRAL CODE COLUMN TO BUYER_PROFILES
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.buyer_profiles WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating referral code on insert
DROP TRIGGER IF EXISTS generate_buyer_referral_code ON public.buyer_profiles;
CREATE TRIGGER generate_buyer_referral_code
BEFORE INSERT ON public.buyer_profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles without referral codes
UPDATE public.buyer_profiles 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 2. INVENTORY RESERVATION FUNCTIONS
-- Function to reserve inventory when order is created
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  current_qty INT;
  current_reserved INT;
  available INT;
BEGIN
  -- Loop through order items
  FOR item IN 
    SELECT oi.product_id, oi.quantity 
    FROM public.order_items oi 
    WHERE oi.order_id = p_order_id
  LOOP
    -- Get current inventory
    SELECT quantity, reserved_quantity INTO current_qty, current_reserved
    FROM public.inventory
    WHERE product_id = item.product_id;
    
    available := COALESCE(current_qty, 0) - COALESCE(current_reserved, 0);
    
    -- Check if enough stock
    IF available < item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item.product_id;
    END IF;
    
    -- Reserve stock
    UPDATE public.inventory
    SET reserved_quantity = reserved_quantity + item.quantity,
        updated_at = NOW()
    WHERE product_id = item.product_id;
    
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function to deduct inventory when order is confirmed (paid)
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  inv_record RECORD;
BEGIN
  FOR item IN 
    SELECT oi.product_id, oi.quantity, oi.product_name, oi.hpp_at_order
    FROM public.order_items oi 
    WHERE oi.order_id = p_order_id
  LOOP
    -- Get current inventory
    SELECT * INTO inv_record
    FROM public.inventory
    WHERE product_id = item.product_id;
    
    IF inv_record IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Deduct from quantity and reserved
    UPDATE public.inventory
    SET quantity = quantity - item.quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - item.quantity),
        updated_at = NOW()
    WHERE product_id = item.product_id;
    
    -- Log inventory movement
    INSERT INTO public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      reason,
      reference_type,
      reference_id,
      unit_cost
    ) VALUES (
      item.product_id,
      'out',
      item.quantity,
      inv_record.quantity,
      inv_record.quantity - item.quantity,
      'Penjualan: Order ' || (SELECT order_number FROM orders WHERE id = p_order_id),
      'order',
      p_order_id,
      item.hpp_at_order
    );
    
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function to release inventory when order is cancelled
CREATE OR REPLACE FUNCTION public.release_inventory_for_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  inv_record RECORD;
BEGIN
  FOR item IN 
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi 
    WHERE oi.order_id = p_order_id
  LOOP
    -- Get current inventory
    SELECT * INTO inv_record
    FROM public.inventory
    WHERE product_id = item.product_id;
    
    IF inv_record IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Release reserved quantity
    UPDATE public.inventory
    SET reserved_quantity = GREATEST(0, reserved_quantity - item.quantity),
        updated_at = NOW()
    WHERE product_id = item.product_id;
    
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- 3. AUTOMATIC COMMISSION CALCULATION ON DELIVERY
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_profile RECORD;
  referrer_profile RECORD;
  commission_percentage NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Only process when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Get buyer profile
    SELECT * INTO buyer_profile
    FROM public.buyer_profiles
    WHERE id = NEW.buyer_id;
    
    IF buyer_profile IS NULL OR buyer_profile.referrer_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get referrer profile
    SELECT * INTO referrer_profile
    FROM public.buyer_profiles
    WHERE id = buyer_profile.referrer_id;
    
    IF referrer_profile IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get commission percentage from system settings (default 2%)
    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 2) INTO commission_percentage
    FROM public.system_settings
    WHERE key = 'referral_commission_percentage';
    
    IF commission_percentage IS NULL THEN
      commission_percentage := 2;
    END IF;
    
    -- Calculate commission based on subtotal
    commission_amount := ROUND((NEW.subtotal * commission_percentage / 100), 0);
    
    IF commission_amount > 0 THEN
      -- Insert commission record
      INSERT INTO public.referral_commissions (
        referrer_id,
        buyer_id,
        order_id,
        commission_type,
        amount,
        percentage,
        order_subtotal,
        notes
      ) VALUES (
        buyer_profile.referrer_id,
        buyer_profile.id,
        NEW.id,
        'accrual',
        commission_amount,
        commission_percentage,
        NEW.subtotal,
        'Komisi dari order ' || NEW.order_number
      );
      
      -- Update referrer's commission balance
      UPDATE public.buyer_profiles
      SET commission_balance = commission_balance + commission_amount,
          updated_at = NOW()
      WHERE id = buyer_profile.referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS calculate_commission_on_delivery ON public.orders;
CREATE TRIGGER calculate_commission_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_referral_commission();

-- 4. INVENTORY HANDLING ON ORDER STATUS CHANGES
CREATE OR REPLACE FUNCTION public.handle_order_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On order creation (INSERT), reserve inventory
  IF TG_OP = 'INSERT' THEN
    PERFORM public.reserve_inventory_for_order(NEW.id);
    RETURN NEW;
  END IF;
  
  -- On status change to 'paid', deduct inventory
  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    PERFORM public.deduct_inventory_for_order(NEW.id);
    RETURN NEW;
  END IF;
  
  -- On status change to 'cancelled', release inventory (only if not yet paid)
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Only release if was not paid (stock not yet deducted)
    IF OLD.status IN ('new', 'waiting_payment') THEN
      PERFORM public.release_inventory_for_order(NEW.id);
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for inventory handling
DROP TRIGGER IF EXISTS handle_order_inventory_trigger ON public.orders;
CREATE TRIGGER handle_order_inventory_trigger
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_inventory();

-- 5. ADD DEFAULT COMMISSION PERCENTAGE TO SYSTEM SETTINGS
INSERT INTO public.system_settings (key, value, description)
VALUES ('referral_commission_percentage', '2', 'Persentase komisi referral (%)')
ON CONFLICT (key) DO NOTHING;

-- 6. ADD ADMIN BANK ACCOUNT SETTINGS
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('admin_bank_name', 'BCA', 'Nama bank admin untuk pembayaran'),
  ('admin_bank_account', '1234567890', 'Nomor rekening admin'),
  ('admin_bank_holder', 'Osher Shop', 'Nama pemilik rekening admin')
ON CONFLICT (key) DO NOTHING;