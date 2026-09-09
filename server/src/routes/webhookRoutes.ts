import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/paymentController';

const router = Router();

// POST /api/webhooks/razorpay
router.post('/razorpay', handleRazorpayWebhook);

export default router;
