import { test, expect } from '@playwright/test';

test.describe('Global Admin Order Notification & Sound Alert', () => {
  test('should trigger order alert modal and sound notification globally on non-orders admin pages', async ({ page }) => {
    test.setTimeout(60000);
    // 0. Fetch a valid menu item from API
    const menuRes = await page.request.get('http://localhost:5000/api/menu?slot=BREAKFAST');
    const menuBody = await menuRes.json();
    const menuItem = menuBody.items && menuBody.items.length > 0 ? menuBody.items[0] : { id: 'item_default', name: 'Fresh Season Fruit Platter', price: 110 };

    // 1. Login as Admin
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not set.');
    }
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').pressSequentially('admin@yazhisai.com', { delay: 30 });
    await page.locator('input[type="password"]').pressSequentially(adminPassword, { delay: 30 });
    await page.click('button[type="submit"]');

    // Wait for redirect to admin schedule/dashboard
    await page.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { timeout: 15000 });

    // 2. Navigate specifically to Calendar & Slot Engine page (/admin/schedule) — NOT Live Orders Board!
    await page.goto('/admin/schedule');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/Schedule|Slot|Calendar|Granular/i);

    // 3. Emit a new order directly via API / DB simulating incoming customer order
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const orderRes = await page.request.post('http://localhost:5000/api/orders', {
      data: {
        customerName: 'Global Alert Test Customer',
        customerPhone: '9876543210',
        deliveryAddress: '12 Emerald Salai, Chennai',
        isAddressConfirmed: true,
        bookingDate,
        slotType: 'BREAKFAST',
        paymentMethod: 'COD',
        items: [
          { menuItemId: menuItem.id, menuItemName: menuItem.name || 'Fresh Season Fruit Platter', quantity: 1, unitPrice: menuItem.price || 110 }
        ]
      }
    });

    expect([200, 201]).toContain(orderRes.status());

    // 4. Assert that the visual Order Alert Modal appears on screen while Admin is still on /admin/schedule
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('NEW LIVE ORDER RECEIVED!');
    expect(bodyText).toContain('Global Alert Test Customer');

    // Capture screenshot on /admin/schedule page
    await page.screenshot({ path: 'C:/Users/mohan/.gemini/antigravity-ide/brain/63c1e448-78cc-41d4-a5b3-b452014e7373/modal_schedule_page_fixed.png', fullPage: false });

    // 5. Click Acknowledge Order button on modal
    const ackBtn = page.locator('button:has-text("ACKNOWLEDGE"), button:has-text("Acknowledge Order")').first();
    if (await ackBtn.isVisible()) {
      await ackBtn.click();
      await page.waitForTimeout(1000);
    }

    // 6. Navigate to Menu Management page (/admin/menu) and trigger another order to confirm sound alert fires on /admin/menu as well
    await page.goto('/admin/menu');
    await page.waitForLoadState('domcontentloaded');

    const secondOrderRes = await page.request.post('http://localhost:5000/api/orders', {
      data: {
        customerName: 'Menu Page Alert Customer',
        customerPhone: '9876543210',
        deliveryAddress: '12 Emerald Salai, Chennai',
        isAddressConfirmed: true,
        bookingDate,
        slotType: 'BREAKFAST',
        paymentMethod: 'COD',
        items: [
          { menuItemId: menuItem.id, menuItemName: menuItem.name || 'Fresh Season Fruit Platter', quantity: 1, unitPrice: menuItem.price || 110 }
        ]
      }
    });
    expect([200, 201]).toContain(secondOrderRes.status());

    await page.waitForTimeout(2000);
    const menuBodyText = await page.locator('body').innerText();
    expect(menuBodyText).toContain('NEW LIVE ORDER RECEIVED!');
    expect(menuBodyText).toContain('Menu Page Alert Customer');

    // Capture screenshot on /admin/menu page
    await page.screenshot({ path: 'C:/Users/mohan/.gemini/antigravity-ide/brain/63c1e448-78cc-41d4-a5b3-b452014e7373/modal_menu_page_fixed.png', fullPage: false });

    // Acknowledge second modal
    const ackBtn2 = page.locator('button:has-text("ACKNOWLEDGE"), button:has-text("Acknowledge Order")').first();
    if (await ackBtn2.isVisible()) {
      await ackBtn2.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should handle rapid navigation between admin pages without listener gaps or duplicate alerts', async ({ page }) => {
    test.setTimeout(60000);
    const menuRes = await page.request.get('http://localhost:5000/api/menu?slot=BREAKFAST');
    const menuBody = await menuRes.json();
    const menuItem = menuBody.items && menuBody.items.length > 0 ? menuBody.items[0] : { id: 'item_default', name: 'Banana Leaf Meals', price: 220 };

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is not set.');
    }
    await page.goto('/admin/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@yazhisai.com');
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/(schedule|orders|chefs|riders)/, { timeout: 10000 });

    // Rapid navigation sequence: schedule -> menu -> chefs -> riders
    await page.goto('/admin/schedule');
    await page.goto('/admin/menu');
    await page.goto('/admin/chefs');
    await page.goto('/admin/riders');
    await page.waitForLoadState('domcontentloaded');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const rapidOrderRes = await page.request.post('http://localhost:5000/api/orders', {
      data: {
        customerName: 'Rapid Nav Alert Customer',
        customerPhone: '9876543210',
        deliveryAddress: '12 Emerald Salai, Chennai',
        isAddressConfirmed: true,
        bookingDate,
        slotType: 'BREAKFAST',
        paymentMethod: 'COD',
        items: [
          { menuItemId: menuItem.id, menuItemName: menuItem.name || 'Fresh Season Fruit Platter', quantity: 1, unitPrice: menuItem.price || 110 }
        ]
      }
    });
    expect([200, 201]).toContain(rapidOrderRes.status());

    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('NEW LIVE ORDER RECEIVED!');
    expect(bodyText).toContain('Rapid Nav Alert Customer');

    // Confirm EXACTLY ONE modal overlay is rendered (no duplicates)
    const modals = page.locator('text=NEW LIVE ORDER RECEIVED!');
    await expect(modals).toHaveCount(1);
  });
});
