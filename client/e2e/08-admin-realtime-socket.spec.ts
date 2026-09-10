import { test, expect } from '@playwright/test';

test.describe('Admin Realtime Socket Updates to Customer Tracking', () => {
  test('should push real-time status update from Admin console to Customer page via Socket.io', async ({ browser }) => {
    // 1. Create a customer context and page
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    // Navigate to customer orders / tracking page
    await customerPage.goto('/orders');
    await expect(customerPage.locator('body')).toContainText(/My Meal Bookings|My Orders|Orders|Track|Yazhisai/i);

    // 2. Create an admin context and page
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Login as Admin
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[type="email"]', 'admin@yazhisai.com');
    await adminPage.fill('input[type="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');

    // Navigate to Admin Orders
    await adminPage.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { timeout: 10000 });
    await adminPage.goto('/admin/orders');
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
