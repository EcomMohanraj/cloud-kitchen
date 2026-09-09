import { Router } from 'express';
import {
  riderLogin,
  getAvailableOrders,
  acceptOrder,
  updateRiderOrderStatus,
  getMyRiderOrders,
  getRiderLocationForOrder,
  getDeliveryHistory,
} from '../controllers/deliveryPartnerController';
import { requireRider } from '../middlewares/authMiddleware';
import { loginLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public endpoints
router.post('/login', loginLimiter, riderLogin);
router.get('/location/:orderId', getRiderLocationForOrder);

// Protected rider endpoints
router.use(requireRider);

router.get('/available-orders', getAvailableOrders);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', updateRiderOrderStatus);
router.get('/my-orders', getMyRiderOrders);
router.get('/delivery-history', getDeliveryHistory);

export default router;
