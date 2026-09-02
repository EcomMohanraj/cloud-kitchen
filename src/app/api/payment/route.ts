import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { orderId, paymentId, status } = await req.json();

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
    }

    if (status !== 'PAID') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED', paymentId },
      });
      return NextResponse.json({ error: 'Payment failed' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentId,
        orderStatus: 'ACCEPTED',
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
