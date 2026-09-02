import { Router } from 'express';
import { loginAdmin, verifySession, logoutAdmin } from '../controllers/authController';

const router = Router();

router.post('/', loginAdmin);
router.get('/', verifySession);
router.delete('/', logoutAdmin);

export default router;
