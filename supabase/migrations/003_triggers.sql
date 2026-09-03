-- ============================================================================
-- YAZHISAI CLOUD KITCHEN - DATABASE MIGRATION 003
-- Automated Triggers & Functions
-- ============================================================================

-- 1. Trigger Function for auth.users signup -> public.profiles auto-insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
    NEW.raw_user_meta_data->>'phone',
    'CUSTOMER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger Function to update current_orders count on slot_schedules
CREATE OR REPLACE FUNCTION public.increment_slot_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.slot_schedules
  SET current_orders = current_orders + 1
  WHERE date = NEW.booking_date AND slot_type = NEW.slot_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created_increment_slot ON public.orders;
CREATE TRIGGER on_order_created_increment_slot
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_slot_order_count();
