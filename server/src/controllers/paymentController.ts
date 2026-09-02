import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, status } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'orderId and paymentId are required' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        paymentStatus: status || 'PAID',
        orderStatus: 'ACCEPTED',
      },
    });

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Payment processing failed' });
  }
};
