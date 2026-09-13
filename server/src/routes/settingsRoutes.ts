import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/settingsController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/settings
router.get('/', getStoreSettings);

// PUT /api/settings
router.put('/', requireAdmin, updateStoreSettings);

export default router;
