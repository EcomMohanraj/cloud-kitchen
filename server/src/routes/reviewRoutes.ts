import { Router } from 'express';
import {
  createReview,
  getMenuItemReviews,
  getTestimonials,
  getAdminReviews,
  toggleHideReview,
  deleteReviewAdmin,
} from '../controllers/reviewController';
import { requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Public & Customer Endpoints
router.post('/', createReview);
router.get('/menu-item/:menuItemId', getMenuItemReviews);
router.get('/testimonials', getTestimonials);

// Admin Endpoints (requires Admin authentication)
router.get('/admin/all', requireAdmin, getAdminReviews);
router.patch('/admin/:id/hide', requireAdmin, toggleHideReview);
router.delete('/admin/:id', requireAdmin, deleteReviewAdmin);

export default router;
