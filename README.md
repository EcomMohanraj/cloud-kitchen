# Yazhisai Cloud Kitchen (யாழிசை கிளவுட் கிச்சன்) — Monorepo Client-Server Architecture

A schedule-driven, decoupled home cloud kitchen e-commerce web application built with **Next.js 14 Frontend** and **Node.js Express Backend**.

---

## 📁 Repository Structure

```text
yazhisai-cloud-kitchen/
├── client/                     # Frontend Application (Next.js 14 + Tailwind CSS + Zustand)
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # UI components (DatePicker, SlotPills, MenuCard, Cart)
│   │   ├── services/           # Express API integration client
│   │   └── store/              # Zustand Cart & State Store
│   ├── .env.local              # Client env (NEXT_PUBLIC_API_URL=http://localhost:5000/api)
│   └── package.json
│
├── server/                     # Backend Application (Node.js + Express + TypeScript + Prisma)
│   ├── src/
│   │   ├── controllers/        # Route controllers (Schedule, Menu, Orders, Auth)
│   │   ├── routes/             # Express routes (/api/schedule, /api/menu, /api/orders, /api/auth)
│   │   ├── middlewares/        # JWT Auth guards & CORS config
│   │   └── index.ts            # Server entrypoint (Port 5000)
│   ├── prisma/                 # Prisma Schema (`schema.prisma`) & Seed Script (`seed.ts`)
│   ├── .env                    # Server env (PORT=5000, DATABASE_URL, JWT_SECRET)
│   └── package.json
│
├── README.md
└── package.json                # Root script runner (concurrently)
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Push & Seed Database (Backend Server)
```bash
npm run db:push
npm run db:seed
```

### 3. Run Development Servers (Concurrent Execution)
```bash
npm run dev
```

* **Frontend (Next.js):** `http://localhost:3000`
* **Backend API (Express):** `http://localhost:5000/api`
* **Admin Login:** `admin@yazhisai.com` / `admin123`
