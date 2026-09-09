import { Router } from 'express';
import { requireAdmin } from '../middlewares/authMiddleware';
import {
  createChef,
  getAllChefs,
  updateChefActiveStatus,
  getChefOrders,
} from '../controllers/adminChefController';

const router = Router();

router.use(requireAdmin);

router.post('/', createChef);
router.get('/', getAllChefs);
router.get('/:id/orders', getChefOrders);
router.patch('/:id', updateChefActiveStatus);

export default router;

