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

    const numAmount = Number(amount);
    // Convert to paise if passed as INR rupees (e.g., 160 -> 16000), or use directly if passed as paise >= 100
    const amountInPaise = numAmount >= 100 && Number.isInteger(numAmount) && numAmount % 100 === 0 ? numAmount : Math.round(numAmount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Minimum payment amount must be at least 100 paise (₹1)' });
    }

    const razorpay = getRazorpayInstance();

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

    console.log('✅ Created Razorpay order:', razorpayOrder.id, 'for amount', amountInPaise, 'paise');

    return res.json({
      success: true,
      order_id: razorpayOrder.id,
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
    const { orderId, razorpayOrderId, razorpay_order_id, razorpayPaymentId, razorpay_payment_id, razorpaySignature, razorpay_signature } = req.body;

    const rzpOrderId = razorpay_order_id || razorpayOrderId;
    const rzpPaymentId = razorpay_payment_id || razorpayPaymentId;
    const rzpSignature = razorpay_signature || razorpaySignature;

    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return res.status(400).json({ error: 'Missing required Razorpay payment verification parameters (order_id, payment_id, signature)' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server' });
    }

    // Generate expected HMAC SHA256 signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${rzpOrderId}|${rzpPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Strict signature check
    if (generatedSignature !== rzpSignature) {
      console.warn('❌ Payment signature verification failed!', {
        generatedSignature,
        receivedSignature: rzpSignature,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed!',
      });
    }

    console.log('✅ Payment signature verified successfully for order:', rzpOrderId);

    // Update database Order record if orderId provided
    let updatedOrder = null;
    if (orderId) {
      updatedOrder = await prisma.order.update({
        where: { id: String(orderId) },
        data: {
          paymentStatus: 'PAID',
          paymentId: rzpPaymentId,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: rzpSignature,
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
