import { test, expect } from '@playwright/test';

test('Checkout error handling simulates backend downtime', async ({ page }) => {
  test.setTimeout(60000);
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Adding items to cart...');
  const addButton = page.locator('button:has-text("ADD +"), button:has-text("ADD")').first();
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
  await page.waitForTimeout(500);

  const plusButton = page.locator('button:has-text("+")').first();
  if (await plusButton.isVisible()) {
    await plusButton.click();
  } else {
    const secondAddBtn = page.locator('button:has-text("ADD +"), button:has-text("ADD")').nth(1);
    if (await secondAddBtn.isVisible()) {
      await secondAddBtn.click();
    }
  }

  await page.waitForTimeout(1000);

  console.log('Going to checkout...');
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Filling checkout form...');
  await page.fill('input[name="customerName"]', 'Test User');
  await page.fill('input[name="customerPhone"]', '9876543210');
  await page.fill('input[placeholder*="Delivery Address"]', '123 Test Street, Test City');

  const completeButton = page.locator('button:has-text("Complete")');
  if (await completeButton.isVisible()) {
      await completeButton.click();
  }

  const confirmCheckbox = page.locator('input[type="checkbox"]');
  if (await confirmCheckbox.isVisible()) {
      await confirmCheckbox.check();
  }

  // Intercept the create-order API call and force it to fail
  console.log('Intercepting /api/orders to simulate backend failure...');
  await page.route('**/api/orders', route => {
    console.log('--> Intercepted /api/orders and aborted it!');
    route.abort('failed');
  });

  console.log('Clicking Place Order...');
  const placeOrderBtn = page.locator('button:has-text("Place Order")');
  await placeOrderBtn.click();

  console.log('Waiting for error message...');
  const errorMsg = page.locator('text=Failed to place order. Please check your connection and try again.');
  await expect(errorMsg).toBeVisible({ timeout: 5000 });

  console.log('SUCCESS: The correct error message appeared when backend failed!');
});
