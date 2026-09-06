import { Router } from 'express';
import {
  riderLogin,
  getAvailableOrders,
  acceptOrder,
  updateRiderOrderStatus,
  getMyRiderOrders,
} from '../controllers/deliveryPartnerController';
import { requireRider } from '../middlewares/authMiddleware';

const router = Router();

// Public rider authentication
router.post('/login', riderLogin);

// Protected rider endpoints
router.use(requireRider);

router.get('/available-orders', getAvailableOrders);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', updateRiderOrderStatus);
router.get('/my-orders', getMyRiderOrders);

export default router;
