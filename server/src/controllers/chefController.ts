import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';
import { emitOrderStatusUpdated } from '../socket';

const prisma = new PrismaClient();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

// POST /api/chef/login
export const chefLogin = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    const chef = await prisma.chef.findUnique({
      where: { phone: phone.trim() },
    });

    if (!chef) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    if (!chef.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact kitchen administrator.' });
    }

    const isMatch = await bcrypt.compare(password, chef.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const token = jwt.sign(
      {
        chefId: chef.id,
        phone: chef.phone,
        name: chef.name,
        role: 'CHEF',
      },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('chef_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      ...(isProd && { domain: '.yazhisaicloudkitchen.in' }),
    });

    return res.json({
      success: true,
      role: 'CHEF',
      token,
      chef: {
        id: chef.id,
        name: chef.name,
        phone: chef.phone,
      },
    });
  } catch (error: any) {
    console.error('Chef login error:', error);
    return res.status(500).json({ error: 'Internal server error during chef login.' });
  }
};

// GET /api/chef/live-orders
// EXCLUDES all billing & pricing info (paymentStatus, paymentMethod, totalAmount, unitPrice, subtotal, etc.)
export const getLiveChefOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderStatus: {
          in: ['PENDING', 'ACCEPTED', 'PREPARING'],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        bookingDate: true,
        slotType: true,
        preferredTime: true,
        orderStatus: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            menuItemId: true,
            menuItemName: true,
            quantity: true,
            menuItem: {
              select: {
                imageUrl: true,
                nameTamil: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get live chef orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch live orders for chef.' });
  }
};

// PATCH /api/chef/orders/:id/accept
export const acceptChefOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const chefId = req.chef?.chefId;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (existingOrder.orderStatus !== 'PENDING') {
      return res.status(400).json({ error: `Cannot accept order in status "${existingOrder.orderStatus}".` });
    }

    const updateData: any = { orderStatus: 'ACCEPTED' };
    if (chefId) updateData.preparedByChefId = chefId;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
        preparedByChef: {
          select: { id: true, name: true, phone: true },
        },
        user: true,
      },
    });

    emitOrderStatusUpdated(updatedOrder);

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Chef accept order error:', error);
    return res.status(500).json({ error: 'Failed to accept order.' });
  }
};

// PATCH /api/chef/orders/:id/start-preparing
export const startPreparingOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const chefId = req.chef?.chefId;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!['PENDING', 'ACCEPTED'].includes(existingOrder.orderStatus)) {
      return res.status(400).json({ error: `Cannot start preparing order in status "${existingOrder.orderStatus}".` });
    }

    const updateData: any = { orderStatus: 'PREPARING' };
    if (chefId) updateData.preparedByChefId = chefId;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
        preparedByChef: {
          select: { id: true, name: true, phone: true },
        },
        user: true,
      },
    });

    emitOrderStatusUpdated(updatedOrder);

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Chef start preparing order error:', error);
    return res.status(500).json({ error: 'Failed to update order to PREPARING.' });
  }
};

// PATCH /api/chef/orders/:id/ready-for-pickup
export const markReadyForPickup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const chefId = req.chef?.chefId;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!['PENDING', 'ACCEPTED', 'PREPARING'].includes(existingOrder.orderStatus)) {
      return res.status(400).json({ error: `Cannot mark order ready for pickup in status "${existingOrder.orderStatus}".` });
    }

    const updateData: any = { orderStatus: 'READY_FOR_PICKUP' };
    if (chefId && !existingOrder.preparedByChefId) {
      updateData.preparedByChefId = chefId;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
        preparedByChef: {
          select: { id: true, name: true, phone: true },
        },
        user: true,
      },
    });

    emitOrderStatusUpdated(updatedOrder);

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Chef mark ready for pickup error:', error);
    return res.status(500).json({ error: 'Failed to update order to READY_FOR_PICKUP.' });
  }
};

