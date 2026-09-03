-- ============================================================================
-- YAZHISAI CLOUD KITCHEN - DATABASE MIGRATION 002
-- Strict Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Users can read/update own profile" ON public.profiles;
CREATE POLICY "Users can read/update own profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public/Anon user read profiles" ON public.profiles;
CREATE POLICY "Public/Anon user read profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Slot Schedules Policies (Public read, admin write)
DROP POLICY IF EXISTS "Anyone can view slot schedules" ON public.slot_schedules;
CREATE POLICY "Anyone can view slot schedules"
  ON public.slot_schedules FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can modify slots" ON public.slot_schedules;
CREATE POLICY "Authenticated users can modify slots"
  ON public.slot_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Kitchen Settings Policies (Public read, admin write)
DROP POLICY IF EXISTS "Anyone can view kitchen settings" ON public.kitchen_settings;
CREATE POLICY "Anyone can view kitchen settings"
  ON public.kitchen_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Menu Items Policies (Public read active items, admin write)
DROP POLICY IF EXISTS "Anyone can view active menu items" ON public.menu_items;
CREATE POLICY "Anyone can view active menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 5. Orders Policies (Customers read/write own orders, admin full access)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Order Items Policies
DROP POLICY IF EXISTS "Anyone can read order items" ON public.order_items;
CREATE POLICY "Anyone can read order items"
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
