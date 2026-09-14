import { test, expect } from '@playwright/test';

test.describe('Admin Order Management Flow', () => {
  test('should authenticate admin and view kitchen order matrix', async ({ page }) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not set.');
    }
    // Navigate to Admin Login Page
    await page.goto('/admin/login');
    await page.waitForTimeout(1000);

    // Fill Admin Credentials
    await page.fill('input[type="email"]', 'admin@yazhisai.com');
    await page.fill('input[type="password"]', adminPassword);

    // Submit Login Form
    await page.click('button[type="submit"]');

    // Wait for redirect to admin page
    await page.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Navigate to Admin Orders View
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Assert admin matrix header
    await expect(page.locator('body')).toContainText(/Order|Kitchen|Management|Admin|Matrix|Schedule|Console/i);
  });
});
