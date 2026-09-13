import { prisma } from '../config/db';

export async function cleanupAbandonedOrders(): Promise<number> {
  try {
    // Cutoff time: 15 minutes ago
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAYMENT_PENDING',
        createdAt: {
          lt: cutoffTime,
        },
      },
      data: {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
      },
    });

    if (result.count > 0) {
      console.log(`🧹 [OrderCleanup] Marked ${result.count} abandoned PAYMENT_PENDING order(s) as PAYMENT_FAILED.`);
    }

    return result.count;
  } catch (error) {
    console.error('❌ [OrderCleanup] Error cleaning up abandoned orders:', error);
    return 0;
  }
}

export function startOrderCleanupJob() {
  console.log('⏰ [OrderCleanup] Starting background order cleanup job (runs every 5 minutes)...');
  // Run once on startup
  cleanupAbandonedOrders();
  // Schedule every 5 minutes (300,000 ms)
  setInterval(cleanupAbandonedOrders, 5 * 60 * 1000);
}
