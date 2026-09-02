import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Invalid menu item'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Enter a valid 10-digit phone number').max(15),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER']),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
});

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { id, date, slot } = req.query;

    if (id && typeof id === 'string') {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.json({ order });
    }

    const whereClause: any = {};
    if (date && typeof date === 'string') whereClause.bookingDate = date;
    if (slot && typeof slot === 'string') whereClause.slotType = slot;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const validated = createOrderSchema.parse(req.body);

    const schedule = await prisma.slotsSchedule.findUnique({
      where: {
        date_slotType: {
          date: validated.bookingDate,
          slotType: validated.slotType,
        },
      },
    });

    if (!schedule || !schedule.isActive || schedule.isAvailable === false) {
      return res.status(400).json({
        error: `Orders are closed for ${validated.bookingDate} (${validated.slotType}). Please choose an active calendar date and meal slot.`,
      });
    }

    const menuItemIds = validated.items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const itemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    let subtotal = 0;
    const orderItemsData: Array<{
      menuItemId: string;
      menuItemName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of validated.items) {
      const dbItem = itemMap.get(item.menuItemId);
      if (!dbItem || !dbItem.isAvailable) {
        return res.status(400).json({
          error: `Item "${dbItem?.name || 'Selected item'}" is currently unavailable.`,
        });
      }

      const itemTotal = dbItem.price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        menuItemId: dbItem.id,
        menuItemName: dbItem.name,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        totalPrice: itemTotal,
      });
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = `CK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        deliveryAddress: validated.deliveryAddress,
        bookingDate: validated.bookingDate,
        slotType: validated.slotType,
        preferredTime: validated.preferredTime,
        paymentMethod: validated.paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        subtotal,
        deliveryFee,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return res.json({ success: true, order: newOrder });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to place order' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update order status' });
  }
};
