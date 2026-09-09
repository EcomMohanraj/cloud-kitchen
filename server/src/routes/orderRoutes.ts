import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, markCashCollected } from '../controllers/orderController';
import { requireAdmin, requireAuthOrCustomer } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuthOrCustomer, getOrders);
router.post('/', createOrder);
router.patch('/', requireAdmin, updateOrderStatus);
router.patch('/:id/mark-cash-collected', requireAuthOrCustomer, markCashCollected);

export default router;

