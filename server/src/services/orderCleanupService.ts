import { prisma } from '../config/db';
import Razorpay from 'razorpay';
import { emitNewOrder, emitOrderStatusUpdated } from '../socket';
import { sendOrderConfirmedEmail } from './emailService';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export interface CleanupResult {
  recoveredCount: number;
  failedCount: number;
  skippedCount: number;
}

export async function cleanupAbandonedOrders(): Promise<CleanupResult> {
  try {
    // Cutoff time: 5 minutes ago for stuck online orders
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000);

    // Limit to 50 orders per cycle to prevent Razorpay API rate limit issues
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'ONLINE',
        paymentStatus: { in: ['PENDING', 'PAYMENT_PENDING'] },
        createdAt: {
          lt: cutoffTime,
        },
      },
      include: { items: true, user: true },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingOrders.length === 0) {
      return { recoveredCount: 0, failedCount: 0, skippedCount: 0 };
    }

    const razorpay = getRazorpayInstance();
    let recoveredCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const order of pendingOrders) {
      // 1. If Razorpay order ID exists, query Razorpay to verify payment status
      if (razorpay && order.razorpayOrderId) {
        let paymentsRes: any = null;
        let apiFailed = false;

        try {
          paymentsRes = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        } catch (err: any) {
          apiFailed = true;
          skippedCount++;
          console.warn(
            `⚠️ [OrderCleanup] Razorpay API query failed for order ${order.orderNumber || order.id} (${order.razorpayOrderId}): ${
              err.message || err
            }. Skipping order status modification to retry on next cycle.`
          );
        }

        // Safety Guard: If Razorpay API call failed, DO NOT mark order as FAILED. Skip and retry next cycle.
        if (apiFailed) {
          continue;
        }

        const items = paymentsRes?.items || [];
        const capturedPayment = items.find((p: any) => p.status === 'captured');

        if (capturedPayment) {
          const expectedPaise = Math.round(Number(order.totalAmount) * 100);
          if (Number(capturedPayment.amount) === expectedPaise) {
            const updatedOrder = await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                paymentId: capturedPayment.id,
                razorpayPaymentId: capturedPayment.id,
                orderStatus: 'ACCEPTED',
              },
              include: { items: true, user: true },
            });

            emitNewOrder(updatedOrder);
            emitOrderStatusUpdated(updatedOrder);
            sendOrderConfirmedEmail(updatedOrder).catch((err) =>
              console.warn('⚠️ [Resend] Non-blocking reconciliation confirmation email error:', err)
            );

            console.log(
              `⚠️ [RECOVERY] Order ${order.orderNumber || order.id} was PENDING but Razorpay confirms PAID (Payment ID: ${
                capturedPayment.id
              }) — auto-recovered to ACCEPTED & PAID.`
            );
            recoveredCount++;
            continue;
          } else {
            console.warn(
              `⚠️ [OrderCleanup] Amount mismatch for order ${order.orderNumber || order.id}! Paid: ${capturedPayment.amount}, Expected: ${expectedPaise}. Marking FAILED.`
            );
          }
        }

        // Razorpay API succeeded and confirmed no captured payments exist for this order
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            orderStatus: 'PAYMENT_FAILED',
          },
        });
        failedCount++;
      } else {
        // No razorpayOrderId associated (e.g. modal closed before initiation). Mark FAILED if older than 15 mins.
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (order.createdAt < fifteenMinsAgo) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              orderStatus: 'PAYMENT_FAILED',
            },
          });
          failedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    if (recoveredCount > 0 || failedCount > 0 || skippedCount > 0) {
      console.log(
        `🧹 [OrderCleanup] Cycle completed: Auto-recovered ${recoveredCount} order(s), marked ${failedCount} order(s) as PAYMENT_FAILED, skipped ${skippedCount} order(s).`
      );
    }

    return { recoveredCount, failedCount, skippedCount };
  } catch (error) {
    console.error('❌ [OrderCleanup] Error cleaning up abandoned orders:', error);
    return { recoveredCount: 0, failedCount: 0, skippedCount: 0 };
  }
}

export function startOrderCleanupJob() {
  if (process.env.ENABLE_INTERNAL_ORDER_CLEANUP !== 'true') {
    console.log(
      'ℹ️ [OrderCleanup] Internal background timer disabled (external cron-job.org handles /api/orders/cleanup-abandoned to allow Neon scale-to-zero).'
    );
    return;
  }

  console.log('⏰ [OrderCleanup] Starting background order cleanup job (runs every 5 minutes)...');
  // Run once on startup
  cleanupAbandonedOrders();
  // Schedule every 5 minutes (300,000 ms)
  setInterval(cleanupAbandonedOrders, 5 * 60 * 1000);
}

