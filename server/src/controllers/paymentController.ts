import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/db';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not configured in environment variables');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

// 1. Create Razorpay Order
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId ? String(orderId).substring(0, 40) : `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Link razorpayOrderId to database Order record if orderId provided
    if (orderId) {
      try {
        await prisma.order.update({
          where: { id: String(orderId) },
          data: {
            razorpayOrderId: razorpayOrder.id,
          },
        });
      } catch (err) {
        console.warn('⚠️ Could not associate razorpayOrderId to DB order during pre-creation:', err);
      }
    }

    console.log('✅ Created Razorpay order:', razorpayOrder.id, 'for amount ₹', amount);

    return res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('❌ Error creating Razorpay order:', error);
    return res.status(500).json({ error: error.message || 'Razorpay order creation failed' });
  }
};

// 2. Verify Razorpay Payment Signature
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing required Razorpay payment verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server' });
    }

    // Generate expected HMAC SHA256 signature
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Strict signature check
    if (generatedSignature !== razorpaySignature) {
      console.warn('❌ Payment signature verification failed!', {
        generatedSignature,
        receivedSignature: razorpaySignature,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed!',
      });
    }

    console.log('✅ Payment signature verified successfully for order:', razorpayOrderId);

    // Update database Order record if orderId provided
    let updatedOrder = null;
    if (orderId) {
      updatedOrder = await prisma.order.update({
        where: { id: String(orderId) },
        data: {
          paymentStatus: 'PAID',
          paymentId: razorpayPaymentId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          orderStatus: 'ACCEPTED',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('❌ Error verifying Razorpay payment:', error);
    return res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
};

// 3. Fallback direct process payment for manual/legacy updates
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
