import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';
import { emitNewOrder, emitOrderStatusUpdated } from '../socket';
import { validateDeliveryAddress } from '../utils/addressValidation';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendCodOrderConfirmedEmail, sendOrderDeliveredEmail } from '../services/emailService';
import { cleanupAbandonedOrders } from '../services/orderCleanupService';

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

export const getOrders = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized access. Authentication token missing.' });
    }

    const { id, date, slot, phone } = req.query;

    // 1. Single Order Fetch by ID
    if (id && typeof id === 'string') {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id },
            { orderNumber: id },
          ],
        },
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

      // IDOR Authorization Guard
      if (userRole === 'CUSTOMER') {
        const customerPhone = req.user.phone;
        if (order.customerPhone !== customerPhone) {
          return res.status(403).json({ error: 'Forbidden. You are not authorized to view orders belonging to another user.' });
        }
      } else if (userRole === 'RIDER') {
        const riderId = req.user.deliveryPartnerId;
        if (order.deliveryPartnerId !== riderId && order.orderStatus !== 'READY_FOR_PICKUP') {
          return res.status(403).json({ error: 'Forbidden. Access restricted to assigned orders or available pickup orders.' });
        }
      }

      return res.json({ order, orders: [order] });
    }

    // 2. Orders List Query
    const whereClause: any = {
      orderStatus: { notIn: ['PAYMENT_PENDING', 'PAYMENT_FAILED'] },
    };

    if (userRole === 'CUSTOMER') {
      const customerPhone = req.user.phone;
      if (phone && typeof phone === 'string' && phone.trim() !== customerPhone) {
        return res.status(403).json({ error: 'Forbidden. Cannot query order history of another customer.' });
      }
      whereClause.customerPhone = customerPhone;
    } else if (userRole === 'RIDER') {
      const riderId = req.user.deliveryPartnerId;
      whereClause.OR = [
        { deliveryPartnerId: riderId },
        { deliveryPartnerId: null, orderStatus: 'READY_FOR_PICKUP' },
      ];
    } else if (userRole === 'ADMIN') {
      if (phone && typeof phone === 'string') {
        whereClause.customerPhone = phone.trim();
      }
    }

    if (date && typeof date === 'string') whereClause.bookingDate = date;
    if (slot && typeof slot === 'string' && slot !== 'ALL') whereClause.slotType = slot;

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

    // Defensive Safety Net: Reject any order where items span multiple distinct slot categories in DB
    const distinctSlotCategories = new Set(
      dbMenuItems.map((item) => (item.slotCategory || '').toUpperCase())
    );

    if (distinctSlotCategories.size > 1) {
      const categoriesStr = Array.from(distinctSlotCategories).join(', ');
      console.warn(`⚠️ [Order Security] Blocked multi-slot order submission containing categories: [${categoriesStr}]`);
      return res.status(400).json({
        error: `Single-slot restriction: All items in an order must belong to the same meal slot. Found items from multiple slots (${categoriesStr}). Please checkout each meal slot separately.`,
      });
    }

    if (distinctSlotCategories.size === 1) {
      const itemSlotCategory = Array.from(distinctSlotCategories)[0];
      if (itemSlotCategory && itemSlotCategory !== validated.slotType.toUpperCase()) {
        console.warn(
          `⚠️ [Order Security] Slot mismatch: Items belong to ${itemSlotCategory} but order requested for ${validated.slotType}`
        );
        return res.status(400).json({
          error: `Slot category mismatch: The items in your cart belong to ${itemSlotCategory}, but the order slot is set to ${validated.slotType}. Please select the ${itemSlotCategory} slot.`,
        });
      }
    }

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

    // Fetch Store Settings from database
    const settingsList = await prisma.settings.findMany({
      where: { key: { in: ['defaultDeliveryFee', 'enableDeliveryFee', 'defaultPackingFee', 'enablePackingFee', 'minOrderValue'] } },
    });
    const settingsMap = new Map(settingsList.map((s) => [s.key, s.value]));

    const minOrderVal = settingsMap.has('minOrderValue') ? parseFloat(settingsMap.get('minOrderValue')!) : 100;
    if (subtotal < minOrderVal) {
      return res.status(400).json({
        error: `Minimum order value is ₹${minOrderVal}. Current subtotal is ₹${subtotal}.`,
      });
    }

    const enableDel = settingsMap.has('enableDeliveryFee') ? settingsMap.get('enableDeliveryFee') === 'true' : true;
    const baseDelFee = settingsMap.has('defaultDeliveryFee') ? parseFloat(settingsMap.get('defaultDeliveryFee')!) : 40;
    const deliveryFee = !enableDel || subtotal > 500 ? 0 : (isNaN(baseDelFee) ? 40 : baseDelFee);

    const enablePack = settingsMap.has('enablePackingFee') ? settingsMap.get('enablePackingFee') === 'true' : true;
    const basePackFee = settingsMap.has('defaultPackingFee') ? parseFloat(settingsMap.get('defaultPackingFee')!) : 15;
    const packingFee = !enablePack ? 0 : (isNaN(basePackFee) ? 15 : basePackFee);

    const totalAmount = subtotal + deliveryFee + packingFee;
    const orderNumber = `ORD-YZH-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.upsert({
      where: { phone: validated.customerPhone },
      update: { name: validated.customerName, address: validated.deliveryAddress },
      create: { phone: validated.customerPhone, name: validated.customerName, address: validated.deliveryAddress },
    });

    const isOnline = validated.paymentMethod === 'ONLINE';
    const initialPaymentStatus = isOnline ? 'PAYMENT_PENDING' : 'PENDING';
    const initialOrderStatus = isOnline ? 'PAYMENT_PENDING' : 'PENDING';

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
        paymentStatus: initialPaymentStatus,
        orderStatus: initialOrderStatus,
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

    if (newOrder.paymentMethod === 'COD') {
      emitNewOrder(newOrder);
      sendCodOrderConfirmedEmail(newOrder).catch((err) =>
        console.warn('⚠️ [Resend] Non-blocking COD order confirmation email error:', err)
      );
    }

    if (newOrder.paymentMethod === 'COD') {
      sendCodOrderConfirmedEmail(newOrder).catch((err) =>
        console.warn('⚠️ [Resend] Non-blocking COD order confirmation email error:', err)
      );
    }

    return res.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Create order controller error:', error);
    return res.status(400).json({ error: error.message || 'Failed to place order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, orderStatus, paymentStatus, cancelReason } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isTransitioningToDelivered =
      orderStatus === 'DELIVERED' && existingOrder.orderStatus !== 'DELIVERED';
    const isTransitioningToCancelled =
      orderStatus === 'CANCELLED' && existingOrder.orderStatus !== 'CANCELLED';

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID') {
        updateData.paymentCollectedAt = new Date();
        updateData.paymentCollectedBy = req.user?.name || req.user?.phone || 'Admin';
      }
    }

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

    // If order was cancelled, decrement currentOrders capacity count on SlotsSchedule
    if (isTransitioningToCancelled) {
      console.log(`🚫 [Admin Cancel Order] Order #${existingOrder.orderNumber || existingOrder.id} cancelled by admin. Reason: "${cancelReason || 'Customer requested'}"`);

      if (existingOrder.bookingDate && existingOrder.slotType) {
        try {
          const schedule = await prisma.slotsSchedule.findUnique({
            where: {
              date_slotType: {
                date: existingOrder.bookingDate,
                slotType: existingOrder.slotType,
              },
            },
          });
          if (schedule && schedule.currentOrders > 0) {
            await prisma.slotsSchedule.update({
              where: { id: schedule.id },
              data: { currentOrders: Math.max(0, schedule.currentOrders - 1) },
            });
          }
        } catch (scheduleErr) {
          console.warn('⚠️ Non-blocking error decrementing slot schedule currentOrders on cancel:', scheduleErr);
        }
      }
    }

    emitOrderStatusUpdated(updatedOrder);

    if (isTransitioningToDelivered && updatedOrder.orderStatus === 'DELIVERED') {
      sendOrderDeliveredEmail(updatedOrder).catch((err) =>
        console.warn('⚠️ [Resend] Non-blocking order delivery email error:', err)
      );
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update order status' });
  }
};

// ─── Public Tracking Endpoint (no auth required) ─────────────────────────────
// Fetches order status by orderNumber for the customer tracking page.
// Intentionally requires NO JWT so that shared tracking links (SMS, WhatsApp)
// always return the current DB status without falling back to stale localStorage.
// PII (full phone) is masked before returning.
export const getOrderForTracking = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber },
          { id: orderNumber },
        ],
      },
      include: {
        items: true,
        deliveryPartner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found. Please check your tracking link.' });
    }

    // Mask phone number for public endpoint (show only last 4 digits)
    const safeOrder = {
      ...order,
      customerPhone: order.customerPhone
        ? `${'*'.repeat(Math.max(0, order.customerPhone.length - 4))}${order.customerPhone.slice(-4)}`
        : '',
    };

    return res.json({ order: safeOrder });
  } catch (error: any) {
    console.error('getOrderForTracking error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch order status' });
  }
};

export const markCashCollected = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'RIDER') {
      return res.status(403).json({ error: 'Forbidden. Cash collection can only be recorded by an Admin or assigned Rider.' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ error: 'Cash collection is only applicable for Cash on Delivery (COD) orders.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Payment for this order has already been marked as PAID.' });
    }

    if (!['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Cash cannot be collected until the order is OUT_FOR_DELIVERY or DELIVERED.' });
    }

    const collectorName =
      req.user?.name ||
      req.user?.phone ||
      (userRole === 'ADMIN' ? 'Admin' : 'Delivery Partner');

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentCollectedAt: new Date(),
        paymentCollectedBy: `${userRole === 'ADMIN' ? 'Admin' : 'Rider'}: ${collectorName}`,
      },
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
    console.error('Mark cash collected controller error:', error);
    return res.status(400).json({ error: error.message || 'Failed to mark cash collected' });
  }
};

// ─── External Cron Endpoint for Render Free Tier ──────────────────────────────
export const triggerCleanupEndpoint = async (req: Request, res: Response) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const clientHeaderSecret = req.headers['x-cron-secret'];

    if (cronSecret && clientHeaderSecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized cron request. Invalid x-cron-secret header.' });
    }

    const result = await cleanupAbandonedOrders();
    console.log(
      `⏰ [CronEndpoint] Triggered cleanup via external endpoint. Recovered: ${result.recoveredCount}, Failed: ${result.failedCount}, Skipped: ${result.skippedCount}.`
    );

    return res.json({
      success: true,
      message: 'Abandoned order cleanup triggered successfully',
      recoveredCount: result.recoveredCount,
      expiredCount: result.failedCount,
      skippedCount: result.skippedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Trigger cleanup endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Failed to execute cleanup' });
  }
};

