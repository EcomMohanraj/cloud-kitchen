import { Router } from 'express';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getMenuItems);
router.post('/', requireAdmin, createMenuItem);
router.put('/', requireAdmin, updateMenuItem);
router.delete('/', requireAdmin, deleteMenuItem);

export default router;
