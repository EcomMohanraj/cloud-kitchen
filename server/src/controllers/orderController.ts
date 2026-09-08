import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';
import { emitNewOrder, emitOrderStatusUpdated } from '../socket';
import { validateDeliveryAddress } from '../utils/addressValidation';

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Invalid menu item'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  menuItemName: z.string().optional(),
  unitPrice: z.number().optional(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Enter a valid 10-digit phone number').max(15),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  isAddressConfirmed: z.boolean().optional().default(false),
  deliveryLatitude: z.number().optional().nullable(),
  deliveryLongitude: z.number().optional().nullable(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER']),
  preferredTime: z.string().optional().default('Standard Delivery'),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
});

export const getOrders = async (req: Request, res: Response) => {
  try {
    // SECURITY LIMITATION / IDOR NOTE:
    // Currently, getOrders allows querying by phone number or order ID.
    // In production with customer JWT authentication enabled, phone queries should
    // be strictly bound to the authenticated user's session token payload.
    const { id, date, slot, phone } = req.query;

    if (id && typeof id === 'string') {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          deliveryPartner: {
            select: { id: true, name: true, phone: true },
          },
        },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.json({ order });
    }

    const whereClause: any = {};
    if (date && typeof date === 'string') whereClause.bookingDate = date;
    if (slot && typeof slot === 'string' && slot !== 'ALL') whereClause.slotType = slot;
    if (phone && typeof phone === 'string') whereClause.customerPhone = phone;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
};

const defaultOrderCutoffMap: Record<string, string> = {
  BREAKFAST: '06:00 AM',
  LUNCH: '11:00 AM',
  SNACKS: '03:30 PM',
  DINNER: '06:00 PM',
};

export function isOrderCutoffPassed(
  orderCutoffTimeStr: string | null | undefined,
  bookingDateStr: string,
  slotType?: string
): boolean {
  const effectiveCutoffStr =
    orderCutoffTimeStr || (slotType ? defaultOrderCutoffMap[slotType] : null) || '06:00 AM';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (bookingDateStr > todayStr) return false;
  if (bookingDateStr < todayStr) return true;

  try {
    let cutoffHour = 6;
    let cutoffMinute = 0;

    if (effectiveCutoffStr.includes(':')) {
      const parts = effectiveCutoffStr.replace(/(AM|PM)/i, '').trim().split(':');
      cutoffHour = Number(parts[0]);
      cutoffMinute = Number(parts[1] || 0);

      if (effectiveCutoffStr.toUpperCase().includes('PM') && cutoffHour < 12) {
        cutoffHour += 12;
      } else if (effectiveCutoffStr.toUpperCase().includes('AM') && cutoffHour === 12) {
        cutoffHour = 0;
      }
    }

    const cutoff = new Date();
    cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

    return now > cutoff;
  } catch (error) {
    return false;
  }
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const validated = createOrderSchema.parse(req.body);

    // 1. Backend validation: Address confirmation checkbox MUST be checked
    if (!validated.isAddressConfirmed) {
      return res.status(400).json({
        error: 'Please confirm that your delivery address is complete and correct.',
      });
    }

    // 2. Backend validation: Address must be complete human-readable address (not GPS-only or incomplete)
    const addressValidation = validateDeliveryAddress(validated.deliveryAddress);
    if (!addressValidation.isValid) {
      return res.status(400).json({
        error: addressValidation.error || 'Please enter your complete delivery address. Current location alone is not sufficient.',
      });
    }

    const schedule = await prisma.slotsSchedule.findUnique({
      where: {
        date_slotType: {
          date: validated.bookingDate,
          slotType: validated.slotType,
        },
      },
    });

    if (schedule && (schedule.isAvailable === false || schedule.isActive === false)) {
      return res.status(400).json({
        error: `Orders are closed for ${validated.bookingDate} (${validated.slotType}). Please choose an active calendar date and meal slot.`,
      });
    }

    if (isOrderCutoffPassed(schedule?.orderCutoffTime, validated.bookingDate, validated.slotType)) {
      const cutoffDisplay = schedule?.orderCutoffTime || defaultOrderCutoffMap[validated.slotType] || 'Closed';
      return res.status(400).json({
        error: `Booking deadline for ${validated.slotType} on ${validated.bookingDate} has passed (Order Cutoff: ${cutoffDisplay}).`,
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
      const name = dbItem?.name || item.menuItemName || 'South Indian Dish';
      const price = dbItem?.price || item.unitPrice || 100;

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        menuItemId: dbItem?.id || item.menuItemId,
        menuItemName: name,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
      });
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = `ORD-YZH-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.upsert({
      where: { phone: validated.customerPhone },
      update: { name: validated.customerName, address: validated.deliveryAddress },
      create: { phone: validated.customerPhone, name: validated.customerName, address: validated.deliveryAddress },
    });

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        deliveryAddress: validated.deliveryAddress,
        deliveryLatitude: validated.deliveryLatitude || null,
        deliveryLongitude: validated.deliveryLongitude || null,
        bookingDate: validated.bookingDate,
        slotType: validated.slotType,
        preferredTime: validated.preferredTime || 'Standard Delivery',
        paymentMethod: validated.paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        subtotal,
        deliveryFee,
        totalAmount,
        userId: user.id,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    emitNewOrder(newOrder);

    return res.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Create order controller error:', error);
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
    return res.status(400).json({ error: error.message || 'Failed to update order status' });
  }
};
