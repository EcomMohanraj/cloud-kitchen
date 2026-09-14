import { test, expect } from '@playwright/test';

test.describe('Session Persistence Across Page Refresh', () => {
  test('Admin session should persist across page reloads', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@yazhisai.com');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'YazhisaiNaga@3');
    await page.click('button[type="submit"]');

    // Wait for navigation away from login
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/admin\/login/, { timeout: 10000 });
    await page.goto('/admin/orders');
    await expect(page.locator('body')).toContainText(/Order|Kitchen|Management|Admin|Matrix/i);

    // Refresh page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.url()).not.toContain('/admin/login');
    await expect(page.locator('body')).toContainText(/Order|Kitchen|Management|Admin|Matrix/i);
  });

  test('Chef session should persist across page reloads', async ({ page }) => {
    await page.goto('/chef/login');
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'chef123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/chef\/dashboard/, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Chef Dashboard|Kitchen|Live Orders/i);

    // Refresh page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.url()).not.toContain('/chef/login');
    await expect(page.locator('body')).toContainText(/Chef Dashboard|Kitchen|Live Orders/i);
  });

  test('Rider session should persist across page reloads', async ({ page }) => {
    await page.goto('/rider/login');
    await page.fill('input[type="tel"]', '9999999999');
    await page.fill('input[type="password"]', 'rider123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/rider\/dashboard/, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Rider Command Console|Delivery Partner/i);

    // Refresh page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.url()).not.toContain('/rider/login');
    await expect(page.locator('body')).toContainText(/Rider Command Console|Delivery Partner/i);
  });

  test('Customer session should persist across page reloads', async ({ page }) => {
    // Customer registers to establish session
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.fill('input[placeholder*="Anandan"]', 'Session Test User');
    await page.fill('input[placeholder="9876543210"]', `987${timestamp}`);
    await page.fill('input[placeholder*="gourmet@yazhisai.com"]', `session_${timestamp}@yazhisai.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for submission completion & redirect or page load
    await page.waitForTimeout(3000);
    
    // Navigate to orders page to test session
    await page.goto('/orders');
    await expect(page.locator('body')).toContainText(/Bookings|Orders|Tray|Yazhisai|Meal/i);

    // Refresh page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Bookings|Orders|Tray|Yazhisai|Meal/i);
  });
});
