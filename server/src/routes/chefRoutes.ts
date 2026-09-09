import { Router } from 'express';
import { requireChef } from '../middlewares/authMiddleware';
import {
  chefLogin,
  getLiveChefOrders,
  acceptChefOrder,
  startPreparingOrder,
  markReadyForPickup,
} from '../controllers/chefController';

const router = Router();

// Public chef route
router.post('/login', chefLogin);

// Protected chef routes
router.get('/live-orders', requireChef, getLiveChefOrders);
router.patch('/orders/:id/accept', requireChef, acceptChefOrder);
router.patch('/orders/:id/start-preparing', requireChef, startPreparingOrder);
router.patch('/orders/:id/ready-for-pickup', requireChef, markReadyForPickup);

export default router;
