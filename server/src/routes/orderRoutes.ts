import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, markCashCollected, getOrderForTracking } from '../controllers/orderController';
import { requireAdmin, requireAuthOrCustomer } from '../middlewares/authMiddleware';


const router = Router();

// ── Public: no auth required — used by the customer tracking page ────────────
// This must be registered BEFORE the auth-guarded GET '/' route.
router.get('/track/:orderNumber', getOrderForTracking);

// ── Authenticated routes ─────────────────────────────────────────────────────
router.get('/', requireAuthOrCustomer, getOrders);
router.post('/', createOrder);
router.patch('/', requireAdmin, updateOrderStatus);
router.patch('/:id/mark-cash-collected', requireAuthOrCustomer, markCashCollected);

export default router;

