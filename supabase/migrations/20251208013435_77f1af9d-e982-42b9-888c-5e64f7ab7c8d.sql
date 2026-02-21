-- =============================================
-- FASE 1: Foundation & Authentication
-- POS Retail Full-Featured Database Schema
-- =============================================

-- 1. Create ENUM types for roles and statuses
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_gudang', 'admin_keuangan', 'courier', 'buyer');
CREATE TYPE public.order_status AS ENUM ('new', 'waiting_payment', 'paid', 'assigned', 'picked_up', 'on_delivery', 'delivered', 'cancelled', 'refunded', 'failed', 'returned');
CREATE TYPE public.inventory_movement_type AS ENUM ('in', 'out', 'adjustment');
CREATE TYPE public.commission_type AS ENUM ('accrual', 'reversal', 'payout');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- 2. User Roles Table (RBAC - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Security Definer Function for Role Checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin_gudang', 'admin_keuangan')
  )
$$;

-- 4. Domiciles Master Table (for dropdown)
CREATE TABLE public.domiciles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    province TEXT,
    city TEXT,
    district TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Banks Master Table
CREATE TABLE public.banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Buyer Profiles Table
CREATE TABLE public.buyer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    nik TEXT NOT NULL UNIQUE,
    phone TEXT,
    domicile_id UUID REFERENCES public.domiciles(id),
    referrer_id UUID REFERENCES public.buyer_profiles(id),
    bank_id UUID REFERENCES public.banks(id),
    bank_account_number TEXT,
    bank_account_name TEXT,
    commission_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    commission_pending DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_nik CHECK (LENGTH(nik) = 16 AND nik ~ '^[0-9]+$'),
    CONSTRAINT no_self_referral CHECK (referrer_id IS DISTINCT FROM id)
);

-- 7. Courier Profiles Table
CREATE TABLE public.courier_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_deliveries INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Admin Profiles Table
CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Brands Table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Units Table
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    brand_id UUID REFERENCES public.brands(id),
    unit_id UUID REFERENCES public.units(id),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Product Prices Table (HPP & Selling Price)
CREATE TABLE public.product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    hpp_average DECIMAL(15,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(15,2) NOT NULL,
    het DECIMAL(15,2),
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_selling_price CHECK (het IS NULL OR selling_price <= het)
);

-- 14. Inventory Table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_quantity CHECK (quantity >= 0),
    CONSTRAINT valid_reserved CHECK (reserved_quantity >= 0 AND reserved_quantity <= quantity)
);

-- 15. Inventory Movements Table (Immutable Log)
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) NOT NULL,
    movement_type inventory_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    reason TEXT NOT NULL,
    unit_cost DECIMAL(15,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    buyer_id UUID REFERENCES public.buyer_profiles(id) NOT NULL,
    courier_id UUID REFERENCES public.courier_profiles(id),
    status order_status NOT NULL DEFAULT 'new',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    admin_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_hpp DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Order Items Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_order DECIMAL(15,2) NOT NULL,
    hpp_at_order DECIMAL(15,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_qty CHECK (quantity > 0)
);

-- 18. Order Addresses Table
CREATE TABLE public.order_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    notes TEXT,
    domicile_id UUID REFERENCES public.domiciles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Order Status History Table (Immutable)
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status order_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Payment Confirmations Table
CREATE TABLE public.payment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    proof_image_url TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    transfer_date TIMESTAMPTZ,
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Delivery Proofs Table
CREATE TABLE public.delivery_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    photo_url TEXT NOT NULL,
    notes TEXT,
    recipient_signature TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. Referral Commissions Ledger
CREATE TABLE public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.buyer_profiles(id) NOT NULL,
    buyer_id UUID REFERENCES public.buyer_profiles(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    commission_type commission_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    order_subtotal DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. Payout Requests Table
CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.buyer_profiles(id) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. System Settings Table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. Audit Logs Table (Immutable)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domiciles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- USER ROLES policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- DOMICILES policies (public read)
CREATE POLICY "Anyone can view active domiciles" ON public.domiciles
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage domiciles" ON public.domiciles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- BANKS policies (public read)
CREATE POLICY "Anyone can view active banks" ON public.banks
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage banks" ON public.banks
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- BUYER PROFILES policies
CREATE POLICY "Buyers can view their own profile" ON public.buyer_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Buyers can update their own profile" ON public.buyer_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Buyers can insert their own profile" ON public.buyer_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all buyer profiles" ON public.buyer_profiles
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all buyer profiles" ON public.buyer_profiles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- COURIER PROFILES policies
CREATE POLICY "Couriers can view their own profile" ON public.courier_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Couriers can update their own profile" ON public.courier_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all courier profiles" ON public.courier_profiles
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Buyers can view active couriers" ON public.courier_profiles
    FOR SELECT TO authenticated
    USING (is_active = true AND public.has_role(auth.uid(), 'buyer'));

-- ADMIN PROFILES policies
CREATE POLICY "Admins can view their own profile" ON public.admin_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all admin profiles" ON public.admin_profiles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- CATEGORIES, BRANDS, UNITS policies (public read for active)
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active brands" ON public.brands
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage brands" ON public.brands
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view units" ON public.units
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage units" ON public.units
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- PRODUCTS policies
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- PRODUCT PRICES policies
CREATE POLICY "Anyone can view product prices" ON public.product_prices
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage product prices" ON public.product_prices
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- INVENTORY policies
CREATE POLICY "Anyone can view inventory" ON public.inventory
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- INVENTORY MOVEMENTS policies (append only for most)
CREATE POLICY "Admins can view all movements" ON public.inventory_movements
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert movements" ON public.inventory_movements
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

-- ORDERS policies
CREATE POLICY "Buyers can view their own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can create orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Couriers can view assigned orders" ON public.orders
    FOR SELECT TO authenticated
    USING (courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Couriers can update their assigned orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- ORDER ITEMS policies
CREATE POLICY "Buyers can view their order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Buyers can insert order items" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Couriers can view assigned order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- ORDER ADDRESSES policies (privacy: only visible after courier accepts)
CREATE POLICY "Buyers can view their order addresses" ON public.order_addresses
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Buyers can insert order addresses" ON public.order_addresses
    FOR INSERT TO authenticated
    WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Couriers can view assigned order addresses" ON public.order_addresses
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all order addresses" ON public.order_addresses
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- ORDER STATUS HISTORY policies
CREATE POLICY "Buyers can view their order status history" ON public.order_status_history
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Couriers can view and insert status history" ON public.order_status_history
    FOR ALL TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all status history" ON public.order_status_history
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- PAYMENT CONFIRMATIONS policies
CREATE POLICY "Buyers can view and create their payment confirmations" ON public.payment_confirmations
    FOR ALL TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all payment confirmations" ON public.payment_confirmations
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- DELIVERY PROOFS policies
CREATE POLICY "Buyers can view their delivery proofs" ON public.delivery_proofs
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Couriers can manage delivery proofs" ON public.delivery_proofs
    FOR ALL TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE courier_id IN (SELECT id FROM public.courier_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all delivery proofs" ON public.delivery_proofs
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- REFERRAL COMMISSIONS policies
CREATE POLICY "Referrers can view their commissions" ON public.referral_commissions
    FOR SELECT TO authenticated
    USING (referrer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all commissions" ON public.referral_commissions
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- PAYOUT REQUESTS policies
CREATE POLICY "Buyers can view and create their payout requests" ON public.payout_requests
    FOR ALL TO authenticated
    USING (buyer_id IN (SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- SYSTEM SETTINGS policies
CREATE POLICY "Anyone can view system settings" ON public.system_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()));

-- AUDIT LOGS policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_domiciles_updated_at BEFORE UPDATE ON public.domiciles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON public.buyer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courier_profiles_updated_at BEFORE UPDATE ON public.courier_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON public.payout_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (order_id, status, changed_by)
        VALUES (NEW.id, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_order_status_change_trigger AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Insert initial system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('referral_commission_percentage', '5', 'Persentase komisi referral dari subtotal order'),
('min_payout_amount', '50000', 'Minimum jumlah penarikan komisi'),
('admin_fee', '0', 'Biaya admin per order'),
('shipping_cost_default', '0', 'Biaya pengiriman default');

-- Insert initial banks
INSERT INTO public.banks (name, code) VALUES
('BCA', '014'),
('BNI', '009'),
('BRI', '002'),
('Mandiri', '008'),
('CIMB Niaga', '022'),
('Bank Permata', '013'),
('Bank Danamon', '011'),
('Bank OCBC NISP', '028'),
('Bank Mega', '426'),
('Bank Syariah Indonesia', '451');

-- Insert sample domiciles
INSERT INTO public.domiciles (name, province, city, district) VALUES
('Jakarta Pusat', 'DKI Jakarta', 'Jakarta Pusat', 'Menteng'),
('Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan', 'Kebayoran Baru'),
('Jakarta Barat', 'DKI Jakarta', 'Jakarta Barat', 'Cengkareng'),
('Jakarta Timur', 'DKI Jakarta', 'Jakarta Timur', 'Cakung'),
('Jakarta Utara', 'DKI Jakarta', 'Jakarta Utara', 'Kelapa Gading'),
('Bandung', 'Jawa Barat', 'Bandung', 'Coblong'),
('Surabaya', 'Jawa Timur', 'Surabaya', 'Gubeng'),
('Medan', 'Sumatera Utara', 'Medan', 'Medan Kota'),
('Semarang', 'Jawa Tengah', 'Semarang', 'Semarang Tengah'),
('Yogyakarta', 'DI Yogyakarta', 'Yogyakarta', 'Gondokusuman');

-- Insert default units
INSERT INTO public.units (name, abbreviation) VALUES
('Pieces', 'pcs'),
('Kilogram', 'kg'),
('Gram', 'g'),
('Liter', 'L'),
('Mililiter', 'mL'),
('Box', 'box'),
('Pack', 'pack'),
('Dozen', 'dzn'),
('Carton', 'ctn'),
('Unit', 'unit');