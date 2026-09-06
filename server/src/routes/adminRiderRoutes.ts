import { Router } from 'express';
import {
  createRider,
  getAllRiders,
  getRiderOrders,
  updateRiderActiveStatus,
} from '../controllers/adminRiderController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Require admin authentication for all rider administration endpoints
router.use(requireAdmin);

router.post('/', createRider);
router.get('/', getAllRiders);
router.get('/:id/orders', getRiderOrders);
router.patch('/:id', updateRiderActiveStatus);

export default router;
