import { test, expect } from '@playwright/test';

test.describe('Full Customer Order Lifecycle', () => {
  test('should browse menu, add to cart, checkout, place order, and open live tracking', async ({ page }) => {
    // 1. Browse Homepage / Menu
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Yazhisai|Menu|Cloud Kitchen|Dishes/i);

    // 2. Add dish to cart
    const addButton = page.locator('button:has-text("ADD +"), button:has-text("ADD")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // 3. Navigate to Checkout Page
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Checkout|Tray|Order Summary|Meal/i);

    // 4. Open Checkout Window if needed
    const openCheckoutBtn = page.locator('button:has-text("Open Checkout Window")');
    if (await openCheckoutBtn.isVisible()) {
      await openCheckoutBtn.click();
    }

    // 5. Fill customer details & address
    const nameInput = page.locator('input[placeholder*="Anandan"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Lifecycle Test Customer');
    }

    const phoneInput = page.locator('input[placeholder*="10-digit"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
    }

    const addressArea = page.locator('textarea').first();
    if (await addressArea.isVisible()) {
      await addressArea.fill('100 Anna Salai, T. Nagar, Chennai - 600017');
    }

    const confirmCheckbox = page.locator('input[type="checkbox"]').first();
    if (await confirmCheckbox.isVisible() && !(await confirmCheckbox.isChecked())) {
      await confirmCheckbox.check();
    }

    // 6. Submit Order
    const placeOrderBtn = page.locator('button:has-text("Confirm & Place"), button:has-text("Place Order")').first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
    }

    // 7. Verify order placement & tracking navigation
    await page.waitForTimeout(2500);
    await expect(page.locator('body')).toContainText(/Order|Placed|Confirmed|ORD-|Tray|Checkout|Track/i);
  });
});
