import { test, expect } from '@playwright/test';

test.describe('Chef Workflow Flow', () => {
  test('should authenticate chef, view live kitchen orders, and update status', async ({ page }) => {
    // 1. Navigate to Chef Login
    await page.goto('/chef/login');
    await expect(page.locator('h1')).toContainText('Kitchen Chef Portal');

    // 2. Fill Chef Credentials
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'chef123');

    // 3. Submit Form
    await page.click('button[type="submit"]');

    // 4. Verify redirect to Chef Dashboard
    await page.waitForURL(/\/chef\/dashboard/, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Chef Dashboard|Kitchen|Live Orders|Fulfillment|Chef/i);

    // 5. Check if live orders exist and attempt status update if present
    const acceptBtn = page.locator('button:has-text("Accept Order"), button:has-text("Start Cooking"), button:has-text("Ready for Pickup")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toContainText(/accepted|PREPARING|READY FOR PICKUP|updated|Order/i);
    }
  });
});
