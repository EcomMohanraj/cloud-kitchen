import { Router } from 'express';
import { getSchedule, updateSchedule } from '../controllers/scheduleController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getSchedule);
router.post('/', requireAdmin, updateSchedule);

export default router;
