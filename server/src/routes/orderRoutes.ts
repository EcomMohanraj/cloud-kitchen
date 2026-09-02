import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus } from '../controllers/orderController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/', requireAdmin, updateOrderStatus);

export default router;
