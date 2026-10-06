import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Regression tests for checkout / menu error states and real slot capacity.
 * Requires the API server on :5000 (staging DB) and the Next dev server on :3000.
 *
 * Env:
 *   E2E_SHOT_DIR        where to write screenshots (default ./e2e-screenshots)
 *   E2E_ADMIN_TOKEN     admin JWT for the admin-page tests (skipped if absent)
 *   E2E_CUSTOMER_TOKEN  customer JWT (auth_token cookie) for the checkout tests
 *   E2E_CLOSED_DATE / E2E_CLOSED_SLOT / E2E_CLOSED_ITEM   a closed slot + an item in that slot
 *   E2E_FULL_DATE / E2E_FULL_SLOT / E2E_FULL_ITEM         a fully-booked slot + an item in that slot
 */
const SHOTS = process.env.E2E_SHOT_DIR || path.resolve(__dirname, '../e2e-screenshots');
const ADDRESS = 'No 12, Gandhi Street, Anna Nagar, Chennai 600040';

async function seedCart(page: Page, opts: { date: string; slot: string; itemId: string; price: number }) {
  // Checkout verifies a real server session and clears the cart without one
  await page.context().addCookies([{ name: 'auth_token', value: process.env.E2E_CUSTOMER_TOKEN!, domain: 'localhost', path: '/' }]);
  await page.addInitScript((o) => {
    localStorage.setItem('yazhisai_user_name', 'E2E Tester');
    localStorage.setItem('yazhisai_user_phone', '9876543210');
    localStorage.setItem(
      'yazhisai_cart_storage',
      JSON.stringify({
        state: {
          cartItems: [{ menuItemId: o.itemId, name: 'E2E Test Dish', price: o.price, slotCategory: o.slot, quantity: 1 }],
          selectedDate: o.date,
          selectedSlot: o.slot,
          customerName: 'E2E Tester',
          customerPhone: '9876543210',
          deliveryAddress: o.address,
        },
        version: 0,
      })
    );
  }, { ...opts, address: ADDRESS });
}

async function fillAndSubmitCheckout(page: Page) {
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('e.g. Anandan Kumar').fill('E2E Tester');
  await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
  // Use the saved address if the account has one, otherwise type a full address
  const addressBox = page.getByPlaceholder('House/Door No, Street Name, Landmark, Area & Pincode');
  if (await addressBox.first().isVisible()) await addressBox.first().fill(ADDRESS);
  // Saved addresses load async and reset the confirmation, so wait for the network to settle first
  await page.waitForLoadState('networkidle');
  const confirm = page.getByRole('checkbox', { name: /I confirm that the above delivery address/ });
  await confirm.check();
  await expect(confirm).toBeChecked();
  await page.getByRole('button', { name: /Confirm COD Order/i }).click();
}

async function expectCartIntactOnCheckout(page: Page) {
  await expect(page).toHaveURL(/\/checkout$/);
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('yazhisai_cart_storage') || '{}'));
  expect(cart.state.cartItems.length).toBe(1);
  // No fabricated order may be written to the local order store
  const stored = await page.evaluate(() => localStorage.getItem('yazhisai_orders_store') || '[]');
  expect(stored).not.toContain('E2E Test Dish');
}

test.describe('Checkout failures surface the real error and keep the cart', () => {
  test('API down: network failure shows connection error, no fake order', async ({ page }) => {
    test.skip(!process.env.E2E_FULL_ITEM || !process.env.E2E_CUSTOMER_TOKEN, 'needs E2E_FULL_* + E2E_CUSTOMER_TOKEN env');
    await seedCart(page, { date: process.env.E2E_FULL_DATE!, slot: process.env.E2E_FULL_SLOT!, itemId: process.env.E2E_FULL_ITEM!, price: 110 });
    await page.route('**/api/orders', (route) =>
      route.request().method() === 'POST' ? route.abort('failed') : route.continue()
    );
    await fillAndSubmitCheckout(page);
    const alert = page.getByRole('alert').filter({ hasText: 'Order could not be placed' });
    await expect(alert).toContainText('Could not reach the kitchen server');
    await expectCartIntactOnCheckout(page);
    await page.screenshot({ path: `${SHOTS}/14a-checkout-api-down.png`, fullPage: false });
  });

  test('Order rejected by server: closed slot message is shown verbatim', async ({ page }) => {
    test.skip(!process.env.E2E_CLOSED_ITEM || !process.env.E2E_CUSTOMER_TOKEN, 'needs E2E_CLOSED_* + E2E_CUSTOMER_TOKEN env');
    await seedCart(page, { date: process.env.E2E_CLOSED_DATE!, slot: process.env.E2E_CLOSED_SLOT!, itemId: process.env.E2E_CLOSED_ITEM!, price: 130 });
    await fillAndSubmitCheckout(page);
    const alert = page.getByRole('alert').filter({ hasText: 'Order could not be placed' });
    await expect(alert).toContainText('Orders are closed for');
    await expectCartIntactOnCheckout(page);
    await page.screenshot({ path: `${SHOTS}/14b-checkout-slot-closed.png`, fullPage: false });
  });

  test('Order rejected by server: fully booked slot (capacity enforced)', async ({ page }) => {
    test.skip(!process.env.E2E_FULL_ITEM || !process.env.E2E_CUSTOMER_TOKEN, 'needs E2E_FULL_* + E2E_CUSTOMER_TOKEN env');
    await seedCart(page, { date: process.env.E2E_FULL_DATE!, slot: process.env.E2E_FULL_SLOT!, itemId: process.env.E2E_FULL_ITEM!, price: 110 });
    await fillAndSubmitCheckout(page);
    const alert = page.getByRole('alert').filter({ hasText: 'Order could not be placed' });
    await expect(alert).toContainText('is fully booked');
    await expectCartIntactOnCheckout(page);
    await page.screenshot({ path: `${SHOTS}/14c-checkout-slot-full.png`, fullPage: false });
  });
});

test.describe('Menu fetch failures show an error state, never sample dishes', () => {
  test('Storefront: menu API down shows retryable error', async ({ page }) => {
    await page.route('**/api/menu**', (route) => route.abort('failed'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const err = page.getByRole('alert').filter({ hasText: 'Unable to load menu, please try again' });
    await expect(err).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Chettinad Idli Platter')).toHaveCount(0);
    await err.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/14d-storefront-menu-error.png`, fullPage: false });

    // Recovery: once the API is back, Try Again clears the error
    await page.unroute('**/api/menu**');
    await err.getByRole('button', { name: /Try Again/i }).click();
    await expect(err).toHaveCount(0, { timeout: 15000 });
  });

  test('Admin menu: API down shows error, not sample dishes', async ({ page, context }) => {
    test.skip(!process.env.E2E_ADMIN_TOKEN, 'needs E2E_ADMIN_TOKEN');
    await context.addCookies([{ name: 'admin_token', value: process.env.E2E_ADMIN_TOKEN!, domain: 'localhost', path: '/' }]);
    await page.route('**/api/menu**', (route) => route.abort('failed'));
    await page.goto('/admin/menu', { waitUntil: 'domcontentloaded' });
    const err = page.getByRole('alert').filter({ hasText: 'Unable to load menu, please try again' });
    await expect(err).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Chettinad Idli Platter')).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/14e-admin-menu-error.png`, fullPage: false });
  });
});

test('Admin schedule shows the real booked count', async ({ page, context }) => {
  test.skip(!process.env.E2E_ADMIN_TOKEN || !process.env.E2E_FULL_DATE, 'needs admin token + full slot');
  await context.addCookies([{ name: 'admin_token', value: process.env.E2E_ADMIN_TOKEN!, domain: 'localhost', path: '/' }]);
  await page.goto('/admin/schedule', { waitUntil: 'domcontentloaded' });
  const res = await page.request.get('http://localhost:5000/api/schedule');
  const day = (await res.json()).schedule.find((d: any) => d.date === process.env.E2E_FULL_DATE);
  const slot = day.slots[process.env.E2E_FULL_SLOT!];
  const label = `${slot.bookedOrders} / ${slot.maxOrders} Booked`;
  const card = page.getByText(label).first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/14f-admin-schedule-real-capacity.png`, fullPage: false });
});
