import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus } from '../controllers/orderController';
import { requireAdmin, requireAuthOrCustomer } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuthOrCustomer, getOrders);
router.post('/', createOrder);
router.patch('/', requireAdmin, updateOrderStatus);

export default router;

