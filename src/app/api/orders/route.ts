import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { verifyAdminFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');
    const bookingDate = searchParams.get('date');
    const slotType = searchParams.get('slot');

    // Single order query (Customer status tracking)
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    // Admin query filters
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const whereClause: any = {};
    if (bookingDate) whereClause.bookingDate = bookingDate;
    if (slotType) whereClause.slotType = slotType;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = createOrderSchema.parse(body);

    // STRICT SCHEDULE VALIDATION: Ensure selected date & meal slot are enabled by Admin
    const schedule = await prisma.slotsSchedule.findUnique({
      where: {
        date_slotType: {
          date: validated.bookingDate,
          slotType: validated.slotType,
        },
      },
    });

    if (!schedule || !schedule.isActive || schedule.isAvailable === false) {
      return NextResponse.json(
        {
          error: `Orders are closed for ${validated.bookingDate} (${validated.slotType}). Please choose an active calendar date and meal slot.`,
        },
        { status: 400 }
      );
    }

    // Calculate totals
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
        return NextResponse.json(
          { error: `Item "${dbItem?.name || 'Selected item'}" is currently unavailable.` },
          { status: 400 }
        );
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
        paymentStatus: validated.paymentMethod === 'ONLINE' ? 'PENDING' : 'PENDING',
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

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, orderStatus, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 400 });
  }
}
