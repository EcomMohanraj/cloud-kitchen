import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, markCashCollected, getOrderForTracking, triggerCleanupEndpoint } from '../controllers/orderController';
import { requireAdmin, requireAuthOrCustomer } from '../middlewares/authMiddleware';


const router = Router();

// ── Public: no auth required — used by the customer tracking page ────────────
// This must be registered BEFORE the auth-guarded GET '/' route.
router.get('/track/:orderNumber', getOrderForTracking);
router.post('/cleanup-abandoned', triggerCleanupEndpoint);

// ── Authenticated routes ─────────────────────────────────────────────────────
router.get('/', requireAuthOrCustomer, getOrders);
router.post('/', createOrder);
router.patch('/', requireAdmin, updateOrderStatus);
router.patch('/:id/mark-cash-collected', requireAuthOrCustomer, markCashCollected);

export default router;

