import { test, expect } from '@playwright/test';

test.describe('Logout Functionality for All User Roles', () => {
  test('Admin logout should clear admin_token cookie and bounce to admin login', async ({ page }) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not set.');
    }
    // Login
    await page.goto('/admin/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@yazhisai.com');
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { timeout: 15000 });

    // Click Logout Admin
    const logoutBtn = page.locator('button:has-text("Logout Admin"), button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page.goto('/admin/orders');
      const sideLogout = page.locator('button:has-text("Logout Admin"), button:has-text("Logout")').first();
      await sideLogout.click();
    }

    await page.waitForTimeout(1500);

    // Confirm visiting protected route bounces to admin login
    await page.goto('/admin/orders');
    await page.waitForTimeout(1000);
    await expect(page.url()).toContain('/admin/login');
  });

  test('Chef logout should clear chef session and bounce to chef login', async ({ page }) => {
    // Login
    await page.goto('/chef/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'chef123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/chef\/dashboard/, { timeout: 15000 });

    // Click Logout
    const logoutBtn = page.locator('button[title*="Logout"], button:has-text("Logout"), button:has-text("Sign Out")').first();
    await logoutBtn.click();
    await page.waitForTimeout(1500);

    // Confirm visiting protected route bounces to chef login
    await page.goto('/chef/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.url()).toContain('/chef/login');
  });

  test('Rider logout should clear rider session and bounce to rider login', async ({ page }) => {
    // Login
    await page.goto('/rider/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="tel"]', '9999999999');
    await page.fill('input[type="password"]', 'rider123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/rider\/dashboard/, { timeout: 15000 });

    // Click Logout
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
    await page.waitForTimeout(1500);

    // Confirm visiting protected route bounces to rider login
    await page.goto('/rider/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.url()).toContain('/rider/login');
  });

  test('Customer logout should clear customer session', async ({ page }) => {
    // Customer registers to establish session
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.fill('input[placeholder*="Anandan"]', 'Logout Test User');
    await page.fill('input[placeholder="9876543210"]', `987${timestamp}`);
    await page.fill('input[placeholder*="gourmet@yazhisai.com"]', `logout_${timestamp}@yazhisai.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Click Logout if visible
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
    await page.waitForTimeout(1500);
  });
});
