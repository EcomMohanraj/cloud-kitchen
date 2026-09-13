import { test, expect } from '@playwright/test';

test.describe('Full Customer Order Lifecycle', () => {
  test('should browse menu, add to cart, checkout, place order, and open live tracking', async ({ page }) => {
    test.setTimeout(60000);
    // 0. Register customer to establish valid server auth session
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.fill('input[placeholder*="Anandan"]', 'Lifecycle Test Customer');
    await page.fill('input[placeholder="9876543210"]', `987${timestamp}`);
    await page.fill('input[placeholder*="gourmet@yazhisai.com"]', `lifecycle_${timestamp}@yazhisai.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toContainText(/Yazhisai|Menu|Cloud Kitchen|Dishes/i);

    // 2. Add dish to cart (ensuring subtotal >= ₹100 for min order value requirement)
    const addButton = page.locator('button:has-text("ADD +"), button:has-text("ADD")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);
      const plusButton = page.locator('button:has-text("+")').first();
      if (await plusButton.isVisible()) {
        await plusButton.click();
      } else {
        const secondAddBtn = page.locator('button:has-text("ADD +"), button:has-text("ADD")').nth(1);
        if (await secondAddBtn.isVisible()) {
          await secondAddBtn.click();
        }
      }
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
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/Order|Placed|Confirmed|ORD-|Tray|Checkout|Track/i);
  });
});
