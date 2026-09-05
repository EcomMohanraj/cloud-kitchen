import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginAdmin,
  verifySession,
  logoutAdmin,
  registerCustomer,
  loginCustomer,
} from '../controllers/authController';

const router = Router();

// Rate limiting for auth endpoints: max 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', loginAdmin);
router.get('/', verifySession);
router.delete('/', logoutAdmin);

// Customer & Unified Authentication Endpoints with Rate Limiting
router.post('/customer/register', authLimiter, registerCustomer);
router.post('/customer/login', authLimiter, loginCustomer);
router.post('/login', authLimiter, loginCustomer);

export default router;
