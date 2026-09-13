import { test, expect } from '@playwright/test';

test.describe('Razorpay Online Payment Cancellation & Cleanup Flow', () => {
  test('should keep PAYMENT_PENDING orders invisible to Admin/Chef and handle cancellation/cleanup', async ({ page }) => {
    // 0. Fetch tomorrow's date YYYY-MM-DD to avoid cutoff restriction
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const menuRes = await page.request.get(`http://localhost:5000/api/menu?slot=LUNCH`);
    const menuBody = await menuRes.json();
    const menuItem = menuBody.items && menuBody.items.length > 0 ? menuBody.items[0] : { id: 'item_default', name: 'Banana Leaf Meals', price: 220 };

    // 1. Create a PAYMENT_PENDING order directly via backend API (simulating Razorpay checkout initialization)
    const response = await page.request.post('http://localhost:5000/api/orders', {
      data: {
        customerName: 'Test Cancel Customer',
        customerPhone: '9876543210',
        deliveryAddress: '12 Emerald Salai, Chennai',
        isAddressConfirmed: true,
        bookingDate,
        slotType: 'LUNCH',
        paymentMethod: 'ONLINE',
        items: [
          { menuItemId: menuItem.id, menuItemName: menuItem.name || 'Yazhisai Special Banana Leaf Meals', quantity: 1, unitPrice: menuItem.price || 220 }
        ]
      }
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    const order = body.order;
    expect(order).toBeDefined();
    expect(order.orderStatus).toBe('PAYMENT_PENDING');
    expect(order.paymentStatus).toBe('PAYMENT_PENDING');

    const orderId = order.id;
    const orderNumber = order.orderNumber;

    // 2. Navigate to Admin Orders Page and verify order is NOT visible in live board
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@yazhisai.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/(schedule|orders)/, { timeout: 10000 });
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Ensure order number is NOT rendered in the live matrix
    await page.waitForTimeout(2000);
    const adminPageText = await page.locator('body').innerText();
    expect(adminPageText).not.toContain(orderNumber);

    // 3. Navigate to Chef Dashboard and verify order is NOT visible in chef live kitchen view
    await page.goto('/chef/login');
    await page.fill('input[type="tel"]', '8888888888');
    await page.fill('input[type="password"]', 'chef123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/chef\/dashboard/);

    await page.waitForTimeout(2000);
    const chefPageText = await page.locator('body').innerText();
    expect(chefPageText).not.toContain(orderNumber);

    // 4. Simulate user cancelling payment via /api/payment/cancel endpoint
    const cancelRes = await page.request.post('http://localhost:5000/api/payment/cancel', {
      data: { orderId }
    });
    expect(cancelRes.status()).toBe(200);
    const cancelBody = await cancelRes.json();
    expect(cancelBody.order.orderStatus).toBe('PAYMENT_FAILED');
    expect(['FAILED', 'PAYMENT_FAILED']).toContain(cancelBody.order.paymentStatus);

    // 5. Test 15-minute background cleanup endpoint (POST /api/orders/cleanup-abandoned)
    const cleanupRes = await page.request.post('http://localhost:5000/api/orders/cleanup-abandoned');
    expect(cleanupRes.status()).toBe(200);
    const cleanupBody = await cleanupRes.json();
    expect(cleanupBody.success).toBe(true);
  });
});
