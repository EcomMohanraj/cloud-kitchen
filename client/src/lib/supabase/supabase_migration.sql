-- ============================================================================
-- YAZHISAI CLOUD KITCHEN (யாழிசை மனையக உணவகம்) - SUPABASE SCHEMA & RLS MIGRATION
-- ============================================================================

-- 1. ENUM TYPES
CREATE TYPE slot_type AS ENUM ('BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER');
CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('COD', 'ONLINE');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');

-- 2. PROFILES TABLE (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  delivery_address TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  role TEXT DEFAULT 'CUSTOMER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SLOT SCHEDULES TABLE (Granular Date + Slot Capacity Engine)
CREATE TABLE IF NOT EXISTS public.slot_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  slot_type slot_type NOT NULL,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  max_capacity INT DEFAULT 50 NOT NULL CHECK (max_capacity > 0),
  current_orders INT DEFAULT 0 NOT NULL CHECK (current_orders >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(date, slot_type)
);

-- 4. KITCHEN SETTINGS TABLE (Live Chef Status & Announcement)
CREATE TABLE IF NOT EXISTS public.kitchen_settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_chef_online BOOLEAN DEFAULT TRUE,
  kitchen_status TEXT DEFAULT 'OPEN', -- 'OPEN' | 'BUSY' | 'OFFLINE'
  announcement TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.kitchen_settings (id, is_chef_online, kitchen_status, announcement)
VALUES (1, true, 'OPEN', 'Chef Yazhisai is active & accepting fresh pre-orders!')
ON CONFLICT (id) DO UPDATE SET is_chef_online = true, kitchen_status = 'OPEN';

-- 5. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tamil_name TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category_slot slot_type NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE NOT NULL,
  image_url TEXT,
  prep_time_minutes INT DEFAULT 25 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  booking_date DATE NOT NULL,
  slot_type slot_type NOT NULL,
  preferred_time TEXT DEFAULT 'Standard Slot Window',
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method payment_method DEFAULT 'COD' NOT NULL,
  payment_status payment_status DEFAULT 'PENDING' NOT NULL,
  order_status order_status DEFAULT 'PENDING' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE RESTRICT NOT NULL,
  menu_item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active schedules & kitchen settings
CREATE POLICY "Public can view active slot schedules"
  ON public.slot_schedules FOR SELECT
  USING (true);

CREATE POLICY "Public can view kitchen settings"
  ON public.kitchen_settings FOR SELECT
  USING (true);

CREATE POLICY "Public can view active menu items"
  ON public.menu_items FOR SELECT
  USING (is_active = true);

-- Admins full access policy for orders and order_items
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
  ON public.orders FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
CREATE POLICY "Admins have full access to order items"
  ON public.order_items FOR ALL
  USING (true);

CREATE POLICY "Public can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Users view own order items"
  ON public.order_items FOR SELECT
  USING (true);

-- ============================================================================
-- PROMOTING ACCOUNT TO ADMIN IN SUPABASE
-- Run the following SQL query in Supabase SQL Editor:
-- UPDATE public.profiles SET role = 'ADMIN', is_admin = true WHERE phone = '9876543210';
-- ============================================================================

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, delivery_address, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yazhisai Customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
    COALESCE(NEW.raw_user_meta_data->>'delivery_address', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_slot_order_capacity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.slot_schedules (date, slot_type, is_available, max_capacity, current_orders)
  VALUES (NEW.booking_date, NEW.slot_type, TRUE, 50, 1)
  ON CONFLICT (date, slot_type)
  DO UPDATE SET current_orders = public.slot_schedules.current_orders + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_order_created_update_capacity
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_slot_order_capacity();

-- ============================================================================
-- SUPABASE REALTIME SUBSCRIPTIONS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================================
-- SEED DATA
-- ============================================================================
INSERT INTO public.menu_items (name, tamil_name, description, price, category_slot, is_veg, prep_time_minutes, image_url) VALUES
('Chettinad Idli Platter', 'செட்டிநாடு இட்லி பிளேட்டர்', '4 Soft steaming Malligai Idlis served with 3 traditional chutneys & homemade sambar.', 80.00, 'BREAKFAST', TRUE, 15, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'),
('Crispy Ghee Podi Roast Dosa', 'நெய் பொடி தோசை', 'Golden crispy rice crepe sprinkled with hand-ground spicy podi and pure cow ghee.', 110.00, 'BREAKFAST', TRUE, 15, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'),
('Kongu Naattu Kozhi Briyani', 'கொங்கு நாட்டு கோழி பிரியாணி', 'Traditional Seeraga Samba rice chicken biryani cooked slow in authentic clay pot.', 240.00, 'LUNCH', FALSE, 25, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'),
('Traditional Meals Thali', 'பாரம்பரிய உணவுத் தட்டு', 'Full South Indian banana leaf meal with 3 curries, kootu, poriyal, rasam, and payasam.', 160.00, 'LUNCH', TRUE, 20, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80'),
('Madurai Kara Murukku & Filter Coffee', 'கார முறுக்கு & ஃபில்டர் காபி', 'Freshly brewed aromatic South Indian filter coffee with crispy rice murukku.', 90.00, 'SNACKS', TRUE, 10, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'),
('Kothu Parotta Deluxe', 'கொத்து பரோட்டா', 'Shredded flaky parottas tossed with spicy chicken gravy, eggs, and onions on iron tava.', 150.00, 'DINNER', FALSE, 20, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80');

INSERT INTO public.slot_schedules (date, slot_type, is_available, max_capacity, current_orders) VALUES
(CURRENT_DATE, 'BREAKFAST', TRUE, 50, 12),
(CURRENT_DATE, 'SNACKS', TRUE, 50, 8),
(CURRENT_DATE, 'LUNCH', TRUE, 50, 34),
(CURRENT_DATE, 'DINNER', TRUE, 50, 22),
(CURRENT_DATE + 1, 'BREAKFAST', TRUE, 50, 5),
(CURRENT_DATE + 1, 'LUNCH', TRUE, 50, 18);
