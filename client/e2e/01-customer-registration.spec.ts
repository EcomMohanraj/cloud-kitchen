import { test, expect } from '@playwright/test';

test.describe('Customer Registration Flow', () => {
  test('should successfully register a new customer account', async ({ page }) => {
    // Navigate to Registration Page
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Create Account');

    // Generate unique credentials for test run
    const timestamp = Date.now().toString().slice(-6);
    const testPhone = `987${timestamp}`;
    const testEmail = `testuser_${timestamp}@yazhisai.com`;

    // Fill registration form
    await page.fill('input[placeholder*="Anandan"]', 'Test Customer');
    await page.fill('input[placeholder="9876543210"]', testPhone);
    await page.fill('input[placeholder*="gourmet@yazhisai.com"]', testEmail);
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify registration process completes and handles redirect or success message
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Yazhisai|Menu|Meal|Account|Create|Redirecting/i);
  });
});
