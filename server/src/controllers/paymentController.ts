import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { emitNewOrder, emitOrderStatusUpdated } from '../socket';
import { sendOrderConfirmedEmail } from '../services/emailService';

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

// 1. Create Razorpay Order (Secure: Uses Database Order Amount)
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;

    let amountInPaise: number;
    let targetOrderId: string | null = null;
    let dbOrderRecord: any = null;

    if (orderId) {
      // SECURE FIX: Read authoritative order from DB to determine exact totalAmount
      dbOrderRecord = await prisma.order.findUnique({
        where: { id: String(orderId) },
      });

      if (!dbOrderRecord) {
        return res.status(404).json({ error: 'Order not found in database' });
      }

      targetOrderId = dbOrderRecord.id;
      amountInPaise = Math.round(Number(dbOrderRecord.totalAmount) * 100);
    } else {
      // Fallback for previews before order creation
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid payment amount or orderId is required' });
      }
      const numAmount = Number(amount);
      amountInPaise = numAmount >= 100 && Number.isInteger(numAmount) && numAmount % 100 === 0
        ? numAmount
        : Math.round(numAmount * 100);
    }

    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Minimum payment amount must be at least 100 paise (₹1)' });
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: targetOrderId
        ? String(dbOrderRecord?.orderNumber || targetOrderId).substring(0, 40)
        : `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Link razorpayOrderId to database Order record if orderId provided
    if (targetOrderId) {
      try {
        await prisma.order.update({
          where: { id: targetOrderId },
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

// 2. Verify Razorpay Payment Signature + Server-Side Status & Order Verification
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

    // Step 1: HMAC SHA256 Signature Check
    const payload = `${rzpOrderId}|${rzpPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

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

    // Step 2: Fetch payment details from Razorpay server-side
    const razorpay = getRazorpayInstance();
    let paymentDetails: any;
    try {
      paymentDetails = await razorpay.payments.fetch(rzpPaymentId);
    } catch (fetchErr: any) {
      console.error('❌ Error fetching payment details from Razorpay API:', fetchErr);
      return res.status(500).json({ error: 'Failed to verify payment status with Razorpay servers' });
    }

    // Step 3: Strictly verify payment status is 'captured' (authorized/failed/refunded are NOT paid)
    if (!paymentDetails || paymentDetails.status !== 'captured') {
      console.warn('❌ Payment status is not captured:', paymentDetails?.status);
      return res.status(400).json({
        success: false,
        error: `Payment verification failed: Payment status is '${paymentDetails?.status || 'unknown'}' (must be 'captured').`,
      });
    }

    // Step 4: Verify payment belongs to the expected Razorpay order ID
    if (paymentDetails.order_id && paymentDetails.order_id !== rzpOrderId) {
      console.warn(`❌ Razorpay Order ID mismatch! Payment order_id: ${paymentDetails.order_id}, Expected: ${rzpOrderId}`);
      return res.status(400).json({ error: 'Payment gateway record does not match the expected Razorpay order ID' });
    }

    // Locate local DB order
    let targetOrder = null;
    if (orderId) {
      targetOrder = await prisma.order.findUnique({ where: { id: String(orderId) } });
    }
    if (!targetOrder && rzpOrderId) {
      targetOrder = await prisma.order.findFirst({ where: { razorpayOrderId: rzpOrderId } });
    }

    if (!targetOrder) {
      return res.status(404).json({ error: 'Local database order not found' });
    }

    // Verify local DB order's razorpayOrderId matches rzpOrderId (if set)
    if (targetOrder.razorpayOrderId && targetOrder.razorpayOrderId !== rzpOrderId) {
      console.warn(`❌ Local DB Order razorpayOrderId mismatch! DB: ${targetOrder.razorpayOrderId}, Payload: ${rzpOrderId}`);
      return res.status(400).json({ error: 'Local order is not associated with this Razorpay order ID' });
    }

    // Step 5: Verify payment amount matches the database order total
    const expectedPaise = Math.round(Number(targetOrder.totalAmount) * 100);
    if (!paymentDetails.amount || Number(paymentDetails.amount) !== expectedPaise) {
      console.warn(`❌ Payment amount mismatch! Paid: ${paymentDetails.amount}, Expected: ${expectedPaise}`);
      return res.status(400).json({ error: 'Payment amount mismatch between gateway and order record' });
    }

    // Step 6: Idempotent DB update to PAID
    let updatedOrder = targetOrder;
    if (targetOrder.paymentStatus !== 'PAID') {
      const isFirstConfirmation =
        targetOrder.paymentStatus === 'PAYMENT_PENDING' ||
        targetOrder.orderStatus === 'PAYMENT_PENDING' ||
        targetOrder.orderStatus === 'PENDING' ||
        targetOrder.paymentStatus === 'FAILED' ||
        targetOrder.orderStatus === 'PAYMENT_FAILED';

      if (targetOrder.orderStatus === 'PAYMENT_FAILED' || targetOrder.paymentStatus === 'FAILED') {
        console.warn(
          `⚠️ [RECOVERY ALERT] Order ${targetOrder.id} (${targetOrder.orderNumber}) was previously marked PAYMENT_FAILED, but payment was subsequently verified as PAID via Razorpay! Auto-recovering order to ACCEPTED & PAID.`
        );
      }

      updatedOrder = await prisma.order.update({
        where: { id: targetOrder.id },
        data: {
          paymentStatus: 'PAID',
          paymentId: rzpPaymentId,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: rzpSignature,
          orderStatus: 'ACCEPTED',
        },
        include: { items: true, user: true },
      });

      if (isFirstConfirmation) {
        emitNewOrder(updatedOrder);
      }
      emitOrderStatusUpdated(updatedOrder);
      // Fire-and-forget non-blocking order confirmation email
      sendOrderConfirmedEmail(updatedOrder).catch((err) =>
        console.warn('⚠️ [Resend] Non-blocking online payment confirmation email error:', err)
      );
    }

    console.log('✅ Payment verified and order confirmed successfully:', targetOrder.id);

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

// 3. Handle Razorpay Webhook Events (STRICT: Uses ONLY RAZORPAY_WEBHOOK_SECRET, Requires 'captured' status)
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    // SECURE FIX: Webhook secret MUST use ONLY process.env.RAZORPAY_WEBHOOK_SECRET
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET is not configured on server');
      return res.status(500).json({ error: 'Razorpay webhook secret not configured on server' });
    }

    // Read raw body payload for cryptographic HMAC signature verification
    const rawPayload = (req as any).rawBody
      ? (req as any).rawBody.toString('utf8')
      : JSON.stringify(req.body);

    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.warn('❌ Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`📩 Received verified Razorpay webhook event: ${event}`);

    // Process payment captured / order paid events
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload?.payment?.entity;
      const paymentStatus = paymentEntity?.status;

      // SECURE FIX: If payment entity is present, payment status MUST be strictly 'captured'
      if (paymentEntity && paymentStatus !== 'captured') {
        console.warn(`ℹ️ [Webhook] Event '${event}' ignored because payment status is '${paymentStatus}' (not 'captured').`);
        return res.json({ success: true, message: 'Event ignored: payment status not captured' });
      }

      const rzpOrderId = payload?.order?.entity?.id || paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        const dbOrder = await prisma.order.findFirst({
          where: { razorpayOrderId: rzpOrderId },
        });

        if (dbOrder) {
          // IDEMPOTENCY CHECK: If order is already PAID, return 200 OK without re-processing
          if (dbOrder.paymentStatus === 'PAID') {
            console.log(`ℹ️ [Webhook] Order ${dbOrder.id} is already marked PAID. Idempotent return.`);
            return res.json({ success: true, message: 'Event already processed (idempotent)' });
          }

          // Verify amount paid against database totalAmount
          const expectedPaise = Math.round(Number(dbOrder.totalAmount) * 100);
          const payloadAmount = paymentEntity?.amount || payload?.order?.entity?.amount_paid;
          if (payloadAmount && Number(payloadAmount) !== expectedPaise) {
            console.warn(`❌ [Webhook] Amount mismatch! Paid: ${payloadAmount}, Expected: ${expectedPaise}`);
            return res.status(400).json({ error: 'Webhook payment amount mismatch' });
          }

          const isFirstConfirmation =
            dbOrder.paymentStatus === 'PAYMENT_PENDING' ||
            dbOrder.orderStatus === 'PAYMENT_PENDING' ||
            dbOrder.orderStatus === 'PENDING' ||
            dbOrder.paymentStatus === 'FAILED' ||
            dbOrder.orderStatus === 'PAYMENT_FAILED';

          if (dbOrder.orderStatus === 'PAYMENT_FAILED' || dbOrder.paymentStatus === 'FAILED') {
            console.warn(
              `⚠️ [RECOVERY ALERT] Order ${dbOrder.id} (${dbOrder.orderNumber}) was previously marked PAYMENT_FAILED, but payment was subsequently verified as PAID via webhook! Auto-recovering order to ACCEPTED & PAID.`
            );
          }

          const updatedOrder = await prisma.order.update({
            where: { id: dbOrder.id },
            data: {
              paymentStatus: 'PAID',
              paymentId: rzpPaymentId || dbOrder.paymentId,
              razorpayPaymentId: rzpPaymentId || dbOrder.razorpayPaymentId,
              orderStatus: 'ACCEPTED',
            },
            include: { items: true, user: true },
          });

          if (isFirstConfirmation) {
            emitNewOrder(updatedOrder);
          }
          emitOrderStatusUpdated(updatedOrder);
          console.log(`✅ [Webhook] Successfully updated Order ${dbOrder.id} to PAID via webhook`);
          // Fire-and-forget non-blocking order confirmation email
          sendOrderConfirmedEmail(updatedOrder).catch((err) =>
            console.warn('⚠️ [Resend] Non-blocking webhook payment confirmation email error:', err)
          );
        } else {
          console.warn(`⚠️ [Webhook] No local order found for razorpayOrderId: ${rzpOrderId}`);
        }
      }
    } else if (event === 'payment.failed') {
      const rzpOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
      if (rzpOrderId) {
        const dbOrder = await prisma.order.findFirst({
          where: { razorpayOrderId: rzpOrderId },
        });

        if (dbOrder && dbOrder.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: dbOrder.id },
            data: {
              paymentStatus: 'FAILED',
              orderStatus: 'PAYMENT_FAILED',
            },
          });
          console.log(`ℹ️ [Webhook] Marked order ${dbOrder.id} (${rzpOrderId}) as PAYMENT_FAILED due to payment.failed event.`);
        }
      }
    }

    return res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('❌ Error processing Razorpay webhook:', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
};

// 4. Cancel Razorpay Payment (Customer closed modal or payment failed)
export const cancelRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot cancel an order that is already paid.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
      },
    });

    console.log(`ℹ️ Marked order ${order.id} as PAYMENT_FAILED due to customer cancellation / payment failure.`);
    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error cancelling payment order:', error);
    return res.status(500).json({ error: error.message || 'Failed to cancel payment' });
  }
};
