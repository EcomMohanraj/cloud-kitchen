import { Router } from 'express';
import {
  loginAdmin,
  verifySession,
  logoutAdmin,
  registerCustomer,
  loginCustomer,
} from '../controllers/authController';

const router = Router();

router.post('/', loginAdmin);
router.get('/', verifySession);
router.delete('/', logoutAdmin);

// Customer Authentication Endpoints
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

export default router;
