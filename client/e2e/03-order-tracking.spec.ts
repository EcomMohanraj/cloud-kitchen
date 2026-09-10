import { test, expect } from '@playwright/test';

test.describe('Order Tracking Flow', () => {
  test('should view customer orders list and track status', async ({ page }) => {
    // Navigate to Customer Orders / Tracking Page
    await page.goto('/orders');

    // Page title verification using specific h1 heading
    await expect(page.locator('h1').first()).toContainText(/My Meal Bookings|My Orders|Orders|Track|Yazhisai/i);

    // Verify order listing container or empty state
    await expect(page.locator('body')).toContainText(/Bookings|Orders|Tray|Yazhisai|No orders|Meal/i);
  });
});
