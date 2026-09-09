import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getRevenueAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    let { startDate, endDate } = req.query;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Default to last 30 days if dates are not provided
    if (!startDate || typeof startDate !== 'string') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      startDate = past30.toISOString().split('T')[0];
    }
    if (!endDate || typeof endDate !== 'string') {
      endDate = todayStr;
    }

    const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

    // Query orders that are marked as PAID within the date range
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        bookingDate: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrderCount = paidOrders.length;

    // Breakdown by payment method
    const paymentMethodBreakdown = {
      COD: { revenue: 0, orderCount: 0 },
      ONLINE: { revenue: 0, orderCount: 0 },
    };

    // Initialize daily map for all dates in range
    const dailyMap: Record<string, { date: string; revenue: number; orderCount: number; codRevenue: number; onlineRevenue: number }> = {};
    
    // Generate dates in range (inclusive)
    const curr = new Date(startDateTime);
    const endMs = endDateTime.getTime();
    while (curr.getTime() <= endMs) {
      const dStr = curr.toISOString().split('T')[0];
      dailyMap[dStr] = { date: dStr, revenue: 0, orderCount: 0, codRevenue: 0, onlineRevenue: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    for (const order of paidOrders) {
      const method = order.paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD';
      paymentMethodBreakdown[method].revenue += order.totalAmount;
      paymentMethodBreakdown[method].orderCount += 1;

      // Group by created date (YYYY-MM-DD)
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, revenue: 0, orderCount: 0, codRevenue: 0, onlineRevenue: 0 };
      }

      dailyMap[dateKey].revenue += order.totalAmount;
      dailyMap[dateKey].orderCount += 1;
      if (method === 'COD') {
        dailyMap[dateKey].codRevenue += order.totalAmount;
      } else {
        dailyMap[dateKey].onlineRevenue += order.totalAmount;
      }
    }

    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      startDate,
      endDate,
      totalRevenue,
      totalOrderCount,
      paymentMethodBreakdown,
      dailyBreakdown,
    });
  } catch (error: any) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({ error: error.message || 'Failed to calculate revenue analytics' });
  }
};
