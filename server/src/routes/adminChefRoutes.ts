import { Router } from 'express';
import { requireAdmin } from '../middlewares/authMiddleware';
import {
  createChef,
  getAllChefs,
  updateChefActiveStatus,
} from '../controllers/adminChefController';

const router = Router();

router.use(requireAdmin);

router.post('/', createChef);
router.get('/', getAllChefs);
router.patch('/:id', updateChefActiveStatus);

export default router;
