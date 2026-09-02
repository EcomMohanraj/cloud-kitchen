$projectPath = "c:\Users\mohan\Music\cloud kitchen"
$githubUrl   = "https://github.com/EcomMohanraj/cloud-kitchen.git"

Write-Output "=== Step 1: Init Git ==="
Set-Location $projectPath
git init

Write-Output "=== Step 2: Configure identity ==="
git config user.name "EcomMohanraj"
git config user.email "mohanrajapm@zohomail.in"

Write-Output "=== Step 3: Add Remote ==="
git remote remove origin 2>$null
git remote add origin $githubUrl
git remote -v

Write-Output "=== Step 4: Stage All Files ==="
git add .

Write-Output "=== Step 5: Initial Commit ==="
git commit -m "feat: Yazhisai Cloud Kitchen v1.0 - Full-stack South Indian meal pre-order platform

- Next.js 14 App Router with TypeScript
- Admin Shift Scheduler with dynamic slot management
- South Indian Menu Catalog (16 authentic dishes)
- Real-time order lifecycle management
- COD + Online Payment support
- Auto-fill checkout with saved customer profile
- Supabase PostgreSQL with RLS security policies
- Live order tracking with status updates
- Unified Admin Dashboard (/admin/login)
- React hydration error fixes"

Write-Output "=== Step 6: Push to GitHub ==="
git branch -M main
git push -u origin main --force

Write-Output "=== DONE: Code is now on GitHub ==="
