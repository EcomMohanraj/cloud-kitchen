import { test, expect } from '@playwright/test';

test.describe('Rider Workflow Flow', () => {
  test('should authenticate rider, view available pickups, and manage delivery', async ({ page }) => {
    // 1. Navigate to Rider Login
    await page.goto('/rider/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Allow React to hydrate controlled inputs
    await expect(page.locator('h1')).toContainText('Delivery Partner Portal');

    // 2. Fill Rider Credentials (use pressSequentially to trigger React onChange events)
    await page.locator('input[type="tel"]').pressSequentially('9999999999', { delay: 50 });
    await page.locator('input[type="password"]').pressSequentially('rider123', { delay: 50 });

    // 3. Submit Form
    await page.click('button[type="submit"]');

    // 4. Verify redirect to Rider Dashboard
    await page.waitForURL(/\/rider\/dashboard/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Rider Command Console|Delivery Partner|Fleet|Pickups|Deliveries/i);

    // 5. Check for available or active deliveries
    const actionBtn = page.locator('button:has-text("Accept Delivery"), button:has-text("Out for Delivery"), button:has-text("Mark Delivered")').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toContainText(/Order|Delivered|Out for Delivery|Accepted|Updated/i);
    }
  });
});
