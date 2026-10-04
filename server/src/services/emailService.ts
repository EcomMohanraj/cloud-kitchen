import { Resend } from 'resend';
import { prisma } from '../config/db';

let resendClient: Resend | null = null;

// Sender on the verified yazhisaicloudkitchen.in domain. EMAIL_FROM overrides it per environment.
const DEFAULT_EMAIL_FROM = 'Yazhisai Cloud Kitchen <otp@yazhisaicloudkitchen.in>';

function getFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_resend_api_key')) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey.trim());
  }
  return resendClient;
}

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  name?: string
): Promise<{ success: boolean; error?: string }> => {
  const resend = getResendClient();
  const isDevBypass = process.env.DEV_OTP_BYPASS === 'true' || !resend;

  console.log('\n' +
    '╔══════════════════════════════════════════════════════════════════╗\n' +
    `║  🔑 CUSTOMER FORGOT PASSWORD OTP: ${otp}                       ║\n` +
    `║     Target Email: ${email.padEnd(42)} ║\n` +
    '╚══════════════════════════════════════════════════════════════════╝\n'
  );

  if (!resend) {
    console.log('ℹ️  [Resend] RESEND_API_KEY is not configured. DEV_EMAIL_OTP_BYPASS is active (console OTP printed above).');
    return { success: true };
  }

  if (isDevBypass && process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  [Resend] DEV_OTP_BYPASS=true is active. Console OTP printed above.');
    return { success: true };
  }

  try {
    const fromAddress = getFromAddress();
    const data = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `${otp} is your Yazhisai Cloud Kitchen Password Reset Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px; color: #0f172a; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; padding: 36px; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1); }
            .header { text-align: center; margin-bottom: 28px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488); color: white; display: inline-block; padding: 12px 24px; border-radius: 16px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; margin-top: 16px; }
            h2 { color: #0f172a; font-size: 22px; font-weight: 900; margin-top: 20px; margin-bottom: 10px; text-align: center; }
            p { font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin: 8px 0; }
            .otp-box { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 2px dashed #059669; border-radius: 18px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 0; font-family: monospace; }
            .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Yazhisai Gourmet</div>
              <br/>
              <span class="badge">Security & Password Reset</span>
            </div>
            <h2>Password Reset Verification</h2>
            <p>Hello ${name || 'Valued Patron'},</p>
            <p>We received a request to reset your password for your Yazhisai Cloud Kitchen customer account.</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Valid for 10 minutes • Do not share this code</div>
            </div>
            <p>If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
            <div class="footer">
              © ${new Date().getFullYear()} Yazhisai Gourmet Cloud Kitchen • Mettupalayam & Karamadai, Coimbatore
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (data.error) {
      console.error('❌ [Resend] API Error:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`✅ [Resend] Password reset email dispatched successfully to ${email}. ID: ${data.data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Resend] Failed to dispatch email:', err);
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
};

// ─── HELPER: Resolve Customer Registered Email ───────────────────────────────
async function resolveCustomerEmail(order: any): Promise<{ email: string; name: string } | null> {
  if (order.user?.email && order.user.email.trim()) {
    return { email: order.user.email.trim(), name: order.customerName || order.user.name || 'Valued Customer' };
  }
  if (order.userId) {
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, name: true },
    });
    if (user?.email && user.email.trim()) {
      return { email: user.email.trim(), name: order.customerName || user.name || 'Valued Customer' };
    }
  }
  if (order.customerPhone) {
    const user = await prisma.user.findFirst({
      where: { phone: order.customerPhone },
      select: { email: true, name: true },
    });
    if (user?.email && user.email.trim()) {
      return { email: user.email.trim(), name: order.customerName || user.name || 'Valued Customer' };
    }
  }
  return null;
}

// ─── HELPER: Fetch Order Items if Not Loaded ──────────────────────────────────
async function resolveOrderItems(order: any): Promise<any[]> {
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  if (order.id) {
    try {
      return await prisma.orderItem.findMany({ where: { orderId: order.id } });
    } catch {
      return [];
    }
  }
  return [];
}

// ─── HELPER: Render HTML Items Table ──────────────────────────────────────────
function renderItemsTableHtml(items: any[]): string {
  if (!items || items.length === 0) {
    return `<p style="font-style: italic; color: #64748b;">Order items summary available on your tracking page.</p>`;
  }
  const rowsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">
        ${item.menuItemName || item.name || 'Delicious Dish'}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">
        x${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 600;">
        ₹${(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
      <thead>
        <tr style="background-color: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Item</th>
          <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

// ─── TRIGGER 1: Online Payment Success Email ──────────────────────────────────
export const sendOrderConfirmedEmail = async (
  order: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('ℹ️  [Resend] RESEND_API_KEY is not configured. Online order confirmation email skipped.');
      return { success: true };
    }

    const customer = await resolveCustomerEmail(order);
    if (!customer) {
      console.log(`ℹ️  [Resend] No registered email found for customer (phone: ${order.customerPhone}). Confirmation email skipped.`);
      return { success: true };
    }

    const items = await resolveOrderItems(order);
    const itemsTableHtml = renderItemsTableHtml(items);
    const fromAddress = getFromAddress();
    const totalAmountStr = (Number(order.totalAmount) || 0).toFixed(2);
    const subtotalStr = (Number(order.subtotal) || 0).toFixed(2);
    const deliveryFeeStr = (Number(order.deliveryFee) || 0).toFixed(2);

    const data = await resend.emails.send({
      from: fromAddress,
      to: [customer.email],
      subject: `Order Confirmed: #${order.orderNumber} - Yazhisai Cloud Kitchen`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px; color: #0f172a; }
            .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; padding: 36px; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488); color: white; display: inline-block; padding: 12px 24px; border-radius: 16px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; margin-top: 14px; }
            h2 { color: #0f172a; font-size: 22px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; text-align: center; }
            p { font-size: 14px; line-height: 1.6; color: #475569; margin: 8px 0; }
            .status-box { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 1px solid #a7f3d0; border-radius: 16px; padding: 16px; text-align: center; margin: 20px 0; }
            .status-title { font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 4px; }
            .amount { font-size: 28px; font-weight: 900; color: #059669; margin: 4px 0; }
            .details-box { background-color: #f8fafc; border-radius: 16px; padding: 18px; margin: 20px 0; font-size: 13px; color: #334155; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .total-row { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; font-weight: 800; font-size: 16px; color: #0f172a; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Yazhisai Gourmet</div>
              <br/>
              <span class="badge">ORDER CONFIRMED • PAID ONLINE</span>
            </div>
            <h2>Order Confirmed!</h2>
            <p style="text-align: center;">Hello <strong>${customer.name}</strong>, thank you for your order! Your payment was successfully received and our kitchen is readying your meal.</p>
            
            <div class="status-box">
              <div class="status-title">Order #${order.orderNumber}</div>
              <div class="amount">₹${totalAmountStr}</div>
              <div style="font-size: 12px; color: #059669; font-weight: 600;">Payment Status: PAID (Online Gateway)</div>
            </div>

            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">Order Details</h3>
            ${itemsTableHtml}

            <div class="details-box">
              <div style="margin-bottom: 6px;"><strong>Slot:</strong> ${order.slotType || 'Standard'} (${order.bookingDate || 'Today'})</div>
              <div style="margin-bottom: 6px;"><strong>Preferred Time:</strong> ${order.preferredTime || 'As scheduled'}</div>
              <div style="margin-bottom: 12px;"><strong>Delivery Address:</strong> ${order.deliveryAddress}</div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Subtotal:</span> <span>₹${subtotalStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Delivery Fee:</span> <span>₹${deliveryFeeStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; color: #0f172a; margin-top: 6px;">
                  <span>Total Paid:</span> <span>₹${totalAmountStr}</span>
                </div>
              </div>
            </div>

            <p style="text-align: center; font-size: 13px; color: #64748b;">You can track your real-time order status on our app/website anytime.</p>
            
            <div class="footer">
              © ${new Date().getFullYear()} Yazhisai Gourmet Cloud Kitchen • Mettupalayam & Karamadai, Coimbatore
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (data.error) {
      console.warn('⚠️ [Resend] API Error sending order confirmation email:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`✅ [Resend] Order confirmation email sent to ${customer.email} for order #${order.orderNumber}. ID: ${data.data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.warn('⚠️ [Resend] Non-blocking exception sending order confirmation email:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to send confirmation email' };
  }
};

// ─── TRIGGER 2: COD Order Placement Email ─────────────────────────────────────
export const sendCodOrderConfirmedEmail = async (
  order: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('ℹ️  [Resend] RESEND_API_KEY is not configured. COD order confirmation email skipped.');
      return { success: true };
    }

    const customer = await resolveCustomerEmail(order);
    if (!customer) {
      console.log(`ℹ️  [Resend] No registered email found for customer (phone: ${order.customerPhone}). COD confirmation email skipped.`);
      return { success: true };
    }

    const items = await resolveOrderItems(order);
    const itemsTableHtml = renderItemsTableHtml(items);
    const fromAddress = getFromAddress();
    const totalAmountStr = (Number(order.totalAmount) || 0).toFixed(2);
    const subtotalStr = (Number(order.subtotal) || 0).toFixed(2);
    const deliveryFeeStr = (Number(order.deliveryFee) || 0).toFixed(2);

    const data = await resend.emails.send({
      from: fromAddress,
      to: [customer.email],
      subject: `Order Confirmed (COD): #${order.orderNumber} - Yazhisai Cloud Kitchen`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px; color: #0f172a; }
            .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #fed7aa; padding: 36px; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.08); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488); color: white; display: inline-block; padding: 12px 24px; border-radius: 16px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { display: inline-block; background-color: #fff7ed; color: #c2410c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #ffedd5; margin-top: 14px; }
            h2 { color: #0f172a; font-size: 22px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; text-align: center; }
            p { font-size: 14px; line-height: 1.6; color: #475569; margin: 8px 0; }
            .status-box { background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px dashed #f97316; border-radius: 16px; padding: 18px; text-align: center; margin: 20px 0; }
            .status-title { font-size: 14px; font-weight: 800; color: #c2410c; margin-bottom: 4px; }
            .amount { font-size: 28px; font-weight: 900; color: #ea580c; margin: 4px 0; }
            .cod-note { font-size: 13px; font-weight: 700; color: #9a3412; margin-top: 4px; }
            .details-box { background-color: #f8fafc; border-radius: 16px; padding: 18px; margin: 20px 0; font-size: 13px; color: #334155; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Yazhisai Gourmet</div>
              <br/>
              <span class="badge">ORDER CONFIRMED • CASH ON DELIVERY</span>
            </div>
            <h2>Order Placed Successfully!</h2>
            <p style="text-align: center;">Hello <strong>${customer.name}</strong>, thank you for choosing Yazhisai Gourmet! Your Cash on Delivery order has been received.</p>
            
            <div class="status-box">
              <div class="status-title">Order #${order.orderNumber}</div>
              <div class="amount">₹${totalAmountStr}</div>
              <div class="cod-note">💵 Pay ₹${totalAmountStr} in cash on delivery</div>
            </div>

            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">Order Details</h3>
            ${itemsTableHtml}

            <div class="details-box">
              <div style="margin-bottom: 6px;"><strong>Slot:</strong> ${order.slotType || 'Standard'} (${order.bookingDate || 'Today'})</div>
              <div style="margin-bottom: 6px;"><strong>Preferred Time:</strong> ${order.preferredTime || 'As scheduled'}</div>
              <div style="margin-bottom: 12px;"><strong>Delivery Address:</strong> ${order.deliveryAddress}</div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Subtotal:</span> <span>₹${subtotalStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Delivery Fee:</span> <span>₹${deliveryFeeStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; color: #0f172a; margin-top: 6px;">
                  <span>Payable Amount:</span> <span>₹${totalAmountStr}</span>
                </div>
              </div>
            </div>

            <p style="text-align: center; font-size: 13px; color: #64748b;">Please have the exact cash amount ready for our delivery partner.</p>
            
            <div class="footer">
              © ${new Date().getFullYear()} Yazhisai Gourmet Cloud Kitchen • Mettupalayam & Karamadai, Coimbatore
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (data.error) {
      console.warn('⚠️ [Resend] API Error sending COD order confirmation email:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`✅ [Resend] COD order confirmation email sent to ${customer.email} for order #${order.orderNumber}. ID: ${data.data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.warn('⚠️ [Resend] Non-blocking exception sending COD order confirmation email:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to send COD confirmation email' };
  }
};

// ─── TRIGGER 3: Rider Marks Order as Delivered Email ──────────────────────────
export const sendOrderDeliveredEmail = async (
  order: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('ℹ️  [Resend] RESEND_API_KEY is not configured. Order delivered email skipped.');
      return { success: true };
    }

    const customer = await resolveCustomerEmail(order);
    if (!customer) {
      console.log(`ℹ️  [Resend] No registered email found for customer (phone: ${order.customerPhone}). Delivery email skipped.`);
      return { success: true };
    }

    const items = await resolveOrderItems(order);
    const itemsTableHtml = renderItemsTableHtml(items);
    const fromAddress = getFromAddress();
    const deliveredTimeStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const data = await resend.emails.send({
      from: fromAddress,
      to: [customer.email],
      subject: `Your Order Has Been Delivered! #${order.orderNumber} - Yazhisai Cloud Kitchen`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px; color: #0f172a; }
            .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; padding: 36px; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.12); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488); color: white; display: inline-block; padding: 12px 24px; border-radius: 16px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; margin-top: 14px; }
            h2 { color: #0f172a; font-size: 22px; font-weight: 900; margin-top: 16px; margin-bottom: 8px; text-align: center; }
            p { font-size: 14px; line-height: 1.6; color: #475569; margin: 8px 0; }
            .delivered-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 20px; padding: 20px; text-align: center; margin: 20px 0; }
            .delivered-icon { font-size: 36px; margin-bottom: 4px; }
            .delivered-title { font-size: 18px; font-weight: 900; color: #047857; }
            .delivered-time { font-size: 12px; color: #065f46; font-weight: 600; margin-top: 4px; }
            .details-box { background-color: #f8fafc; border-radius: 16px; padding: 18px; margin: 20px 0; font-size: 13px; color: #334155; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Yazhisai Gourmet</div>
              <br/>
              <span class="badge">DELIVERY CONFIRMATION</span>
            </div>
            
            <div class="delivered-box">
              <div class="delivered-icon">🎉</div>
              <div class="delivered-title">Your Order Has Been Delivered!</div>
              <div class="delivered-time">Delivered on ${deliveredTimeStr}</div>
            </div>

            <p style="text-align: center; font-size: 15px; font-weight: 600; color: #0f172a;">
              Hello <strong>${customer.name}</strong>, hope you enjoyed your meal! 🍱✨
            </p>
            <p style="text-align: center;">Your order <strong>#${order.orderNumber}</strong> was handed over successfully.</p>

            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">Delivered Items</h3>
            ${itemsTableHtml}

            <div class="details-box">
              <div style="margin-bottom: 6px;"><strong>Order Number:</strong> #${order.orderNumber}</div>
              <div style="margin-bottom: 6px;"><strong>Delivery Address:</strong> ${order.deliveryAddress}</div>
              <div><strong>Payment Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery (Paid)' : 'Online Payment (Paid)'}</div>
            </div>

            <p style="text-align: center; font-size: 13px; color: #64748b;">
              Thank you for dining with Yazhisai Gourmet Cloud Kitchen! We look forward to serving you again soon.
            </p>
            
            <div class="footer">
              © ${new Date().getFullYear()} Yazhisai Gourmet Cloud Kitchen • Mettupalayam & Karamadai, Coimbatore
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (data.error) {
      console.warn('⚠️ [Resend] API Error sending order delivered email:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`✅ [Resend] Order delivered email sent to ${customer.email} for order #${order.orderNumber}. ID: ${data.data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.warn('⚠️ [Resend] Non-blocking exception sending order delivered email:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to send delivery email' };
  }
};

