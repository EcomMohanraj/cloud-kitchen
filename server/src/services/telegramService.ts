// Admin Telegram alerts via the Bot API (https://core.telegram.org/bots/api#sendmessage).
// Uses Node's built-in fetch — no extra dependency. All failures are logged and swallowed
// so a Telegram outage can never block order creation or payment confirmation.

const TELEGRAM_TIMEOUT_MS = 8000;

const toTitleCase = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatRupees = (amount: number): string =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const sendTelegramMessage = async (text: string): Promise<boolean> => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.log('ℹ️  [Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured. Skipping admin alert.');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Telegram's error body contains only a description (never the token), safe to log.
      const body = await res.text().catch(() => '');
      console.error(`❌ [Telegram] sendMessage failed (HTTP ${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err: any) {
    // Log only the message — the request URL embeds the bot token.
    console.error('❌ [Telegram] sendMessage error:', err?.name === 'TimeoutError' ? 'request timed out' : err?.message || err);
    return false;
  }
};

export const buildNewOrderMessage = (order: any): string => {
  const items: any[] = order.items || [];
  const itemLines = items.length
    ? items.map((item) => `  • ${item.quantity}x ${item.menuItemName}`).join('\n')
    : '  • (no items)';

  const slot = order.slotType ? toTitleCase(String(order.slotType)) : 'N/A';
  const slotDetails = [order.bookingDate, order.preferredTime].filter(Boolean).join(', ');
  const payment = order.paymentMethod === 'COD' ? 'Cash on Delivery' : `Online (${order.paymentStatus})`;

  return [
    `🔔 New Order #${order.orderNumber}`,
    '',
    `👤 Customer: ${order.customerName}`,
    `📞 Phone: ${order.customerPhone}`,
    `🍽️ Items:`,
    itemLines,
    `💰 Total: ${formatRupees(order.totalAmount)}`,
    `💳 Payment: ${payment}`,
    `🕒 Slot: ${slot}${slotDetails ? ` (${slotDetails})` : ''}`,
    `📍 Address: ${order.deliveryAddress}`,
  ].join('\n');
};

// Fire-and-forget: never throws, never awaited by callers.
export const notifyAdminNewOrder = (order: any): void => {
  sendTelegramMessage(buildNewOrderMessage(order))
    .then((sent) => {
      if (sent) console.log(`📨 [Telegram] Admin alert sent for order ${order.orderNumber || order.id}`);
    })
    .catch((err) => console.error('❌ [Telegram] Unexpected notify error:', err?.message || err));
};
