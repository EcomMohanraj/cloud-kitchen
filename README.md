# 🍲 Yazhisai Cloud Kitchen (யாழிசை மனையக உணவகம்)

> An enterprise-grade, decoupled Monorepo pre-order platform for authentic South Indian home-cooked meals. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**.

---

## 🏛️ System Architecture Overview

Yazhisai Cloud Kitchen is designed as a high-performance, slot-capacitated pre-order platform optimized for small-batch cloud kitchens. 

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YAZHISAI CLOUD KITCHEN                             │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 👨‍🍳 CHEF SHIFT SCHEDULER      │ 🛒 CUSTOMER PRE-ORDER FLOW                  │
│  - Define Date Windows        │  - Pick Operating Date & Meal Slot          │
│  - Set Slot Capacities        │  - Select Gourmet Dishes & Ghee Delicacies  │
│  - Manage Live Kitchen Status │  - Instant Checkout (COD / Online UPI)      │
├───────────────────────────────┴─────────────────────────────────────────────┤
│ 📊 KITCHEN ORDER TICKETING (KOT) ENGINE                                     │
│  - Live Order Status Matrix (Accepted -> Preparing -> On The Way -> Delivered)│
│  - Automated Supabase Real-Time Updates & Profile Creation Trigger          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites & Tech Stack

- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Zustand
- **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS), PL/pgSQL Triggers
- **Monorepo Management**: npm Workspaces + Concurrently

---

## 📁 Repository Directory Structure

```text
yazhisai-cloud-kitchen/
├── client/                           # Frontend Next.js Web Application
│   ├── public/                       # Static brand assets & food imagery
│   ├── src/
│   │   ├── app/                      # Next.js 14 App Router
│   │   │   ├── (auth)/               # Customer Authentication (Login / Signup)
│   │   │   ├── (storefront)/         # Customer Pre-Ordering Flow & Checkout
│   │   │   ├── orders/               # Customer Order Tracking Timeline
│   │   │   ├── admin/                # Strictly Protected Kitchen Admin Portal
│   │   │   │   ├── login/
│   │   │   │   ├── schedule/         # Shift & Slot Controller
│   │   │   │   ├── orders/           # Live KOT Kitchen Engine
│   │   │   │   └── menu/             # Dish CRUD Operations
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/               # Modular UI Components
│   │   │   ├── ui/                   # Primitives (Button, Badge, Modal)
│   │   │   ├── layout/               # Dynamic Navbar, Footer, StickyCartBar
│   │   │   ├── storefront/           # DatePicker, SlotPills, MenuCard
│   │   │   └── admin/                # ScheduleCalendar, KotSummaryTable
│   │   ├── context/                  # Global CartContext & AuthContext
│   │   ├── hooks/                    # Custom React Hooks (useCart, useSlots, useAuth)
│   │   ├── services/                 # Pure Supabase API Clients
│   │   │   ├── authService.ts
│   │   │   ├── menuService.ts
│   │   │   └── orderService.ts
│   │   ├── types/                    # Shared TypeScript Interfaces & DB Schemas
│   │   └── utils/                    # Utility Functions (slotTiming.ts, dates.ts)
│   ├── .env.example                  # Client Environment Variables Template
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── supabase/                         # Database Architecture & Migrations
│   ├── migrations/                   # Sequential Migration Files
│   │   ├── 001_initial_schema.sql    # Core DB Schemas & Enums
│   │   ├── 002_rls_policies.sql      # Row Level Security Policies
│   │   └── 003_triggers.sql          # Auto Profile Creation & Slot Counters
│   ├── seed.sql                      # Default Slots & 16 Dish Menu Seed
│   └── config.toml                   # Supabase CLI Project Config
│
├── .gitignore                        # Global Git Ignore Rules
├── package.json                      # Root Monorepo Scripts
└── README.md                         # Developer Onboarding Guide
```

---

## 🔑 Environment Setup

1. Copy the client environment template into `client/.env.local`:
   ```bash
   cp client/.env.example client/.env.local
   ```

2. Fill in your Supabase project credentials in `client/.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"

   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   ```

---

## 🗄️ Database Initialization

Execute the migration scripts sequentially in your **Supabase SQL Editor**:

1. **Schema & Tables**: Run [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/mohan/Music/cloud%20kitchen/supabase/migrations/001_initial_schema.sql)
2. **Security Policies**: Run [`supabase/migrations/002_rls_policies.sql`](file:///c:/Users/mohan/Music/cloud%20kitchen/supabase/migrations/002_rls_policies.sql)
3. **Automated Triggers**: Run [`supabase/migrations/003_triggers.sql`](file:///c:/Users/mohan/Music/cloud%20kitchen/supabase/migrations/003_triggers.sql)
4. **Seed Catalog**: Run [`supabase/seed.sql`](file:///c:/Users/mohan/Music/cloud%20kitchen/supabase/seed.sql)

---

## 🚀 Execution Commands

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Run Local Development Server
```bash
npm run dev
```
- Frontend application runs on: `http://localhost:3000`
- Backend API server runs on: `http://localhost:5000`

### 3. Production Build & Type-Check
```bash
npm run build
```

---

## 🛡️ License

© 2026 **Yazhisai Cloud Kitchen**. All rights reserved.
