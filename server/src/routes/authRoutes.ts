import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginAdmin,
  verifySession,
  logoutAdmin,
  registerCustomer,
  loginCustomer,
  sendCustomerOtp,
  verifyCustomerOtp,
  forgotPasswordCustomer,
  resetPasswordCustomer,
} from '../controllers/authController';

import { loginLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Rate limiting for auth endpoints: max 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', loginLimiter, loginAdmin);
router.get('/', verifySession);
router.delete('/', logoutAdmin);

// Customer OTP Authentication Endpoints
router.post('/customer/send-otp', authLimiter, sendCustomerOtp);
router.post('/customer/verify-otp', authLimiter, verifyCustomerOtp);

// Customer Forgot & Reset Password Endpoints (Rate limited)
router.post('/customer/forgot-password', loginLimiter, forgotPasswordCustomer);
router.post('/customer/reset-password', loginLimiter, resetPasswordCustomer);

// Legacy Customer & Unified Authentication Endpoints
router.post('/customer/register', authLimiter, registerCustomer);
router.post('/customer/login', loginLimiter, loginCustomer);
router.post('/login', loginLimiter, loginCustomer);

export default router;

