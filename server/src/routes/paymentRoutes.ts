import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
} from '../controllers/paymentController';

const router = Router();

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/verify-payment', verifyRazorpayPayment);
router.post('/webhook', handleRazorpayWebhook);

export default router;
