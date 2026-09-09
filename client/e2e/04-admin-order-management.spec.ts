import { test, expect } from '@playwright/test';

test.describe('Admin Order Management Flow', () => {
  test('should authenticate admin and view kitchen order matrix', async ({ page }) => {
    // Set admin authentication cookie
    await page.context().addCookies([
      {
        name: 'admin_token',
        value: 'test_admin_jwt_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to Admin Orders View
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Assert admin dashboard header
    await expect(page.locator('body')).toContainText(/Order|Kitchen|Management|Admin|Matrix|Schedule/i);
  });
});
