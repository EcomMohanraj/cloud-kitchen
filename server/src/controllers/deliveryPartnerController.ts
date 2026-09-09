import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';
import { emitOrderStatusUpdated, emitOrderAssigned } from '../socket';

const prisma = new PrismaClient();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

// POST /api/rider/login
export const riderLogin = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    const partner = await prisma.deliveryPartner.findUnique({
      where: { phone: phone.trim() },
    });

    if (!partner) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    if (!partner.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact kitchen administrator.' });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const token = jwt.sign(
      {
        deliveryPartnerId: partner.id,
        phone: partner.phone,
        name: partner.name,
        role: 'RIDER',
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.cookie('rider_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      role: 'RIDER',
      token,
      rider: {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        isOnline: partner.isOnline,
      },
    });
  } catch (error: any) {
    console.error('Rider login error:', error);
    return res.status(500).json({ error: 'Internal server error during rider login.' });
  }
};

// GET /api/rider/available-orders
export const getAvailableOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderStatus: 'READY_FOR_PICKUP',
        deliveryPartnerId: null,
      },
      include: {
        items: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get available orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch available orders.' });
  }
};

// POST /api/rider/orders/:id/accept
export const acceptOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = req.rider?.deliveryPartnerId;

    if (!riderId) {
      return res.status(401).json({ error: 'Rider authentication required.' });
    }

    // Atomic update to ensure single rider claims the order
    const result = await prisma.order.updateMany({
      where: {
        id,
        deliveryPartnerId: null,
        orderStatus: 'READY_FOR_PICKUP',
      },
      data: {
        deliveryPartnerId: riderId,
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        error: 'Order is no longer available or has already been accepted by another delivery partner.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
        user: true,
      },
    });

    if (order) {
      emitOrderAssigned(order);
      emitOrderStatusUpdated(order);
    }

    return res.json({ success: true, order });
  } catch (error: any) {
    console.error('Accept order error:', error);
    return res.status(500).json({ error: 'Failed to accept order.' });
  }
};

// PATCH /api/rider/orders/:id/status
export const updateRiderOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const riderId = req.rider?.deliveryPartnerId;

    if (!riderId) {
      return res.status(401).json({ error: 'Rider authentication required.' });
    }

    if (!['OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status update. Allowed: OUT_FOR_DELIVERY, DELIVERED.' });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (existingOrder.deliveryPartnerId !== riderId) {
      return res.status(403).json({ error: 'Forbidden. You are not assigned to this order.' });
    }

    // Sequence validation
    if (orderStatus === 'OUT_FOR_DELIVERY' && existingOrder.orderStatus !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ error: 'Order must be READY_FOR_PICKUP before marking OUT_FOR_DELIVERY.' });
    }

    if (orderStatus === 'DELIVERED' && existingOrder.orderStatus !== 'OUT_FOR_DELIVERY') {
      return res.status(400).json({ error: 'Order must be OUT_FOR_DELIVERY before marking DELIVERED.' });
    }

    const updateData: any = { orderStatus };
    if (orderStatus === 'DELIVERED' && existingOrder.paymentMethod === 'COD' && existingOrder.paymentStatus !== 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paymentCollectedAt = new Date();
      updateData.paymentCollectedBy = `Rider: ${req.rider?.name || req.rider?.phone || 'Delivery Partner'}`;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
        user: true,
      },
    });

    emitOrderStatusUpdated(updatedOrder);

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Update rider order status error:', error);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// GET /api/rider/my-orders
export const getMyRiderOrders = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = req.rider?.deliveryPartnerId;

    if (!riderId) {
      return res.status(401).json({ error: 'Rider authentication required.' });
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryPartnerId: riderId,
        orderStatus: {
          not: 'DELIVERED',
        },
      },
      include: {
        items: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get my rider orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch rider assigned orders.' });
  }
};

// GET /api/rider/location/:orderId
export const getRiderLocationForOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId },
        ],
      },
      select: { id: true, deliveryPartnerId: true, orderStatus: true, deliveryLatitude: true, deliveryLongitude: true },
    });

    if (!order || !order.deliveryPartnerId) {
      return res.json({ success: true, location: null, message: 'No delivery partner assigned to order.' });
    }

    const location = await prisma.driverLocation.findUnique({
      where: { deliveryPartnerId: order.deliveryPartnerId },
    });

    return res.json({
      success: true,
      location,
      deliveryCoordinates: {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      },
    });
  } catch (error: any) {
    console.error('Get rider location error:', error);
    return res.status(500).json({ error: 'Failed to fetch rider location.' });
  }
};

// GET /api/rider/delivery-history
export const getDeliveryHistory = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = req.rider?.deliveryPartnerId;

    if (!riderId) {
      return res.status(401).json({ error: 'Rider authentication required.' });
    }

    const { date } = req.query;

    const whereClause: any = {
      deliveryPartnerId: riderId,
      orderStatus: 'DELIVERED',
    };

    if (date && typeof date === 'string') {
      whereClause.bookingDate = date;
    }

    const history = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const allCompletedOrders = await prisma.order.findMany({
      where: {
        deliveryPartnerId: riderId,
        orderStatus: 'DELIVERED',
      },
      select: {
        id: true,
        totalAmount: true,
        bookingDate: true,
        createdAt: true,
      },
    });

    const todayOrders = allCompletedOrders.filter((o) => {
      const completionDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : o.bookingDate;
      return o.bookingDate === todayStr || completionDate === todayStr;
    });

    const todayCount = todayOrders.length;
    const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCount = allCompletedOrders.length;
    const totalEarnings = allCompletedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return res.json({
      success: true,
      history,
      summary: {
        todayCount,
        todayEarnings,
        totalCount,
        totalEarnings,
        todayDate: todayStr,
      },
    });
  } catch (error: any) {
    console.error('Get rider delivery history error:', error);
    return res.status(500).json({ error: 'Failed to fetch delivery history.' });
  }
};
