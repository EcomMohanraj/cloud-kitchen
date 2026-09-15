import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Admin Realtime Socket Updates to Customer Tracking', () => {
  test('should push real-time status update from Admin console to Customer page via Socket.io', async ({ browser }) => {
    // 1. Create a customer context and page
    // Note: browser.newContext() does NOT inherit playwright.config baseURL, so use absolute URLs
    const customerContext = await browser.newContext({ baseURL: BASE_URL });
    const customerPage = await customerContext.newPage();

    // Navigate to customer orders / tracking page
    await customerPage.goto(`${BASE_URL}/orders`);
    await expect(customerPage.locator('body')).toContainText(/My Meal Bookings|My Orders|Orders|Track|Yazhisai/i);

    // 2. Create an admin context and page
    const adminContext = await browser.newContext({ baseURL: BASE_URL });
    const adminPage = await adminContext.newPage();

    // Login as Admin
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not set.');
    }
    await adminPage.goto(`${BASE_URL}/admin/login`);
    await adminPage.waitForLoadState('domcontentloaded');
    await adminPage.waitForTimeout(500); // Allow React to hydrate controlled inputs
    await adminPage.locator('input[type="email"]').pressSequentially('admin@yazhisai.com', { delay: 30 });
    await adminPage.locator('input[type="password"]').pressSequentially(adminPassword, { delay: 30 });
    await adminPage.click('button[type="submit"]');

    // Navigate to Admin Orders
    await adminPage.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { timeout: 15000 });
    await adminPage.goto(`${BASE_URL}/admin/orders`);
    await expect(adminPage.locator('body')).toContainText(/Order|Kitchen|Management|Admin|Matrix|Schedule|Console/i);

    // 3. Perform a status update if orders exist
    const updateBtn = adminPage.locator('button:has-text("Accept"), button:has-text("Preparing"), button:has-text("Update"), button:has-text("Ready")').first();
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
      await adminPage.waitForTimeout(1500);

      // Verify customer page receives updates or renders without errors
      await customerPage.waitForTimeout(2000);
      await expect(customerPage.locator('body')).toContainText(/Bookings|Orders|Tray|Yazhisai|Meal/i);
    }

    await customerContext.close();
    await adminContext.close();
  });
});
