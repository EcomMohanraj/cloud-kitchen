# ============================================================
# STAGING Environment Setup Guide
# Yazhisai Cloud Kitchen
# ============================================================
# This file is a SETUP GUIDE only — never commit real secrets to git.
# Store all actual values in Render's environment variables dashboard
# and Vercel's environment variables settings.

# ─────────────────────────────────────────────────────────────
# STEP 1: Create Neon Staging Database Branch
# ─────────────────────────────────────────────────────────────
# 1. Go to https://console.neon.tech → Your Project
# 2. Click "Branches" in sidebar → "Create Branch"
# 3. Name it: staging
# 4. Source: main (creates a point-in-time copy of production schema)
# 5. Copy the Pooled Connection String → use as DATABASE_URL on Render staging

# Example (fill in your actual Neon staging branch values):
# DATABASE_URL="postgresql://neondb_owner:<password>@ep-<staging-endpoint>.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


# ─────────────────────────────────────────────────────────────
# STEP 2: Render Staging Service Environment Variables
# ─────────────────────────────────────────────────────────────
# Create a NEW Web Service on Render:
#   - Name: yazhisai-cloud-kitchen-server-staging
#   - Repo: EcomMohanraj/cloud-kitchen
#   - Branch: staging         ← IMPORTANT: not main
#   - Root Directory: server
#   - Build Command: npm install && npx prisma generate && npm run build
#   - Start Command: npm start

# Set these environment variables on the Render staging service:
PORT=10000
NODE_ENV=staging
DATABASE_URL=<paste Neon staging branch connection string>

# Staging JWT Secret (DIFFERENT from production)
# ⚠️  NEVER store the real value here. Generate fresh when setting up Render:
#     python -c "import secrets; print(secrets.token_hex(32))"
#     Paste the output ONLY into Render's environment variables dashboard.
JWT_SECRET=<generate-fresh-do-not-store-here>

# Staging Client URL (set after Vercel staging URL is known)
CLIENT_URL=https://cloud-kitchen-staging.vercel.app   # ← update after Vercel step

# Razorpay TEST keys — NEVER use rzp_live_xxx here
# Get from https://dashboard.razorpay.com → Test Mode → API Keys
RAZORPAY_KEY_ID=rzp_test_<your_test_key_id>
RAZORPAY_KEY_SECRET=<your_test_key_secret>

# Cloudinary (same account is fine — staging uploads are isolated by Cloudinary folder)
# ⚠️  Copy values from your Render production service or local .env — do NOT paste here.
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>

# OTP bypass for staging
DEV_OTP_BYPASS=true


# ─────────────────────────────────────────────────────────────
# STEP 3: Vercel Staging Deployment
# ─────────────────────────────────────────────────────────────
# Vercel automatically creates a Preview Deployment for EVERY branch push.
# When you push to 'staging', Vercel will deploy it and give you a URL like:
#   https://cloud-kitchen-git-staging-ecommohanraj.vercel.app
#
# To configure the staging environment variables in Vercel:
# 1. Go to vercel.com → Your Project → Settings → Environment Variables
# 2. For each variable, set Environment to "Preview" (not Production)
#    - NEXT_PUBLIC_API_URL = https://yazhisai-cloud-kitchen-server-staging.onrender.com/api
#    - NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_<your_test_key_id>
#
# You can also assign a custom domain to the staging branch via:
# Vercel Project → Settings → Domains → Add staging.yazhisaicloudkitchen.in → assign to 'staging' branch


# ─────────────────────────────────────────────────────────────
# ISOLATION CHECKLIST
# ─────────────────────────────────────────────────────────────
# [ ] Neon staging branch DB — completely separate from production neondb
# [ ] Render staging service watches 'staging' branch only
# [ ] JWT_SECRET is different from production secret
# [ ] Razorpay keys are TEST mode (rzp_test_xxx) — no real money charged
# [ ] Vercel Preview Deployment watches 'staging' branch
# [ ] CLIENT_URL on Render staging points to Vercel staging URL
# [ ] NEXT_PUBLIC_API_URL on Vercel Preview points to Render staging service


# ─────────────────────────────────────────────────────────────
# WORKFLOW GOING FORWARD
# ─────────────────────────────────────────────────────────────
# 1. All new development happens on branch 'staging' (or feature branches off staging)
# 2. Push to 'staging' → auto-deploys to Render staging + Vercel Preview
# 3. Test everything at the staging URL with test Razorpay keys
# 4. When ready for production: merge staging → main via PR
# 5. main push → production Render service + Vercel Production auto-deploys
