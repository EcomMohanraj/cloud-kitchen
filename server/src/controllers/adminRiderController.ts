import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// Helper to get formatted date string YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// POST /api/admin/riders - Create new Delivery Partner
export const createRider = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const existingRider = await prisma.deliveryPartner.findUnique({
      where: { phone: phone.trim() },
    });

    if (existingRider) {
      return res.status(400).json({ error: 'A delivery partner with this phone number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rider = await prisma.deliveryPartner.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        isActive: true,
        isOnline: false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, rider });
  } catch (error: any) {
    console.error('Admin create rider error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create delivery partner account.' });
  }
};

// GET /api/admin/riders - List all riders with computed statistics
export const getAllRiders = async (req: AuthRequest, res: Response) => {
  try {
    const riders = await prisma.deliveryPartner.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
      },
    });

    const todayStr = getTodayString();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const orders = await prisma.order.findMany({
          where: { deliveryPartnerId: rider.id },
          select: {
            id: true,
            orderStatus: true,
            bookingDate: true,
            createdAt: true,
          },
        });

        const completedOrders = orders.filter((o) => o.orderStatus === 'DELIVERED');
        const activeOrders = orders.filter((o) =>
          ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
        );

        const todayCount = completedOrders.filter((o) => {
          const createdStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
          return o.bookingDate === todayStr || createdStr === todayStr;
        }).length;

        const weekCount = completedOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo).length;
        const monthCount = completedOrders.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo).length;
        const allTimeCount = completedOrders.length;
        const activeOrderCount = activeOrders.length;

        let statusLabel = 'Offline';
        if (!rider.isActive) {
          statusLabel = 'Deactivated';
        } else if (activeOrderCount > 0) {
          statusLabel = 'On Delivery';
        } else if (rider.isOnline) {
          statusLabel = 'Online / Idle';
        }

        return {
          ...rider,
          todayCount,
          weekCount,
          monthCount,
          allTimeCount,
          activeOrderCount,
          statusLabel,
        };
      })
    );

    return res.json({ success: true, riders: ridersWithStats });
  } catch (error: any) {
    console.error('Admin get riders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch delivery partners.' });
  }
};

// GET /api/admin/riders/:id/orders - Order history for one rider with optional date range
export const getRiderOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const rider = await prisma.deliveryPartner.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true, isActive: true, isOnline: true },
    });

    if (!rider) {
      return res.status(404).json({ error: 'Delivery partner not found.' });
    }

    const whereClause: any = {
      deliveryPartnerId: id,
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate && typeof startDate === 'string') dateFilter.gte = startDate;
      if (endDate && typeof endDate === 'string') dateFilter.lte = endDate;
      whereClause.bookingDate = dateFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, rider, orders });
  } catch (error: any) {
    console.error('Admin get rider orders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch rider order history.' });
  }
};


// PATCH /api/admin/riders/:id - Toggle rider active status (deactivate/reactivate)
export const updateRiderActiveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existingRider = await prisma.deliveryPartner.findUnique({
      where: { id },
    });

    if (!existingRider) {
      return res.status(404).json({ error: 'Delivery partner not found.' });
    }

    const newActiveState = typeof isActive === 'boolean' ? isActive : !existingRider.isActive;

    const updatedRider = await prisma.deliveryPartner.update({
      where: { id },
      data: { isActive: newActiveState },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      rider: updatedRider,
      message: `Delivery partner ${updatedRider.name} is now ${updatedRider.isActive ? 'Active' : 'Deactivated'}.`,
    });
  } catch (error: any) {
    console.error('Admin update rider status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update rider status.' });
  }
};
