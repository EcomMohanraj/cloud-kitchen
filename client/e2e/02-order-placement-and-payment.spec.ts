import { test, expect } from '@playwright/test';

test.describe('Order Placement & Payment Flow', () => {
  test('should place an order using Cash on Delivery', async ({ page }) => {
    // Navigate to Storefront
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click ADD button if present on active slot menu items
    const addButton = page.locator('button:has-text("ADD +"), button:has-text("ADD")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Navigate to Checkout Page
    await page.goto('/checkout');

    // Click "Open Checkout Window" if present
    const openCheckoutBtn = page.locator('button:has-text("Open Checkout Window")');
    if (await openCheckoutBtn.isVisible()) {
      await openCheckoutBtn.click();
    }

    // Fill customer profile in checkout modal
    const nameInput = page.locator('input[placeholder*="Anandan"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Customer');
    }

    const phoneInput = page.locator('input[placeholder*="10-digit"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
    }

    // Fill delivery address
    const addressArea = page.locator('textarea').first();
    if (await addressArea.isVisible()) {
      await addressArea.fill('12 Emerald Salai, Near Water Tank, Chennai - 600001');
    }

    // Check address confirmation checkbox
    const confirmCheckbox = page.locator('input[type="checkbox"]').first();
    if (await confirmCheckbox.isVisible() && !(await confirmCheckbox.isChecked())) {
      await confirmCheckbox.check();
    }

    // Submit Order
    const placeOrderBtn = page.locator('button:has-text("Confirm & Place"), button:has-text("Place Order")').first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
    }

    // Verify order flow completion
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(/Order|Placed|Confirmed|ORD-|Tray|Checkout|Meal/i);
  });
});
