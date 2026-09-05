import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  processPayment,
} from '../controllers/paymentController';

const router = Router();

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/process', processPayment);
router.post('/', processPayment);

export default router;
