-- ============================================================================
-- YAZHISAI CLOUD KITCHEN (யாழிசை மனையக உணவகம்) - DATABASE MIGRATION 001
-- Initial Schema Definition (Types & Tables)
-- ============================================================================

-- 1. Custom Enum Types
DO $$ BEGIN
    CREATE TYPE slot_type AS ENUM ('BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('COD', 'ONLINE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Extends auth.users)
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

-- 3. Slot Schedules Table (Shift & Slot Availability Controller)
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

-- 4. Kitchen Settings Table (Live Chef Online Status & Announcements)
CREATE TABLE IF NOT EXISTS public.kitchen_settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_chef_online BOOLEAN DEFAULT TRUE,
  kitchen_status TEXT DEFAULT 'OPEN', -- 'OPEN' | 'BUSY' | 'OFFLINE'
  announcement TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Menu Items Table (South Indian Gourmet Dishes Catalog)
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

-- 6. Orders Table
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

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE RESTRICT NOT NULL,
  menu_item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);
