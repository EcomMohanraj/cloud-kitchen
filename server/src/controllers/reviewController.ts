import { Request, Response } from 'express';
import { prisma } from '../config/db';

/**
 * Customer: Create a verified review
 * POST /api/reviews
 * MUST verify:
 * 1. orderStatus === 'DELIVERED'
 * 2. order belongs to authenticated/specified user (or customer phone)
 * 3. menuItemId was part of order's items
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, phone, orderId, menuItemId, rating, comment } = req.body;

    if (!orderId || !menuItemId || !rating) {
      return res.status(400).json({ error: 'Order ID, Menu Item ID, and rating (1-5) are required' });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // 1. Fetch the target order with its items and user
    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. VERIFICATION CHECK 1: Order status MUST be DELIVERED
    if (order.orderStatus !== 'DELIVERED') {
      return res.status(403).json({
        error: 'Only completed and delivered orders can be reviewed.',
      });
    }

    // 3. VERIFICATION CHECK 2: User authorization matching order
    let targetUser: any = order.user;

    if (!targetUser) {
      const searchPhone = phone || order.customerPhone;
      targetUser = await prisma.user.upsert({
        where: { phone: searchPhone },
        update: { name: order.customerName },
        create: { phone: searchPhone, name: order.customerName },
      });

      // Link user to order if unlinked
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: targetUser.id },
      });
    }

    if (userId && targetUser.id !== String(userId) && order.customerPhone !== phone) {
      return res.status(403).json({
        error: 'You are not authorized to review this order.',
      });
    }

    // 4. VERIFICATION CHECK 3: MenuItem must be present in order items
    const itemInOrder = order.items.some((item) => item.menuItemId === String(menuItemId));
    if (!itemInOrder) {
      return res.status(403).json({
        error: 'This dish was not part of your delivered order.',
      });
    }

    // 5. Check duplicate review for [userId, menuItemId, orderId]
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_menuItemId_orderId: {
          userId: targetUser.id,
          menuItemId: String(menuItemId),
          orderId: order.id,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({
        error: 'You have already reviewed this dish for this order.',
      });
    }

    // 6. Create Review
    const review = await prisma.review.create({
      data: {
        userId: targetUser.id,
        menuItemId: String(menuItemId),
        orderId: order.id,
        rating: parsedRating,
        comment: comment ? String(comment).trim() : null,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        menuItem: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
};

/**
 * Public: Get reviews for a specific dish
 * GET /api/reviews/menu-item/:menuItemId
 */
export const getMenuItemReviews = async (req: Request, res: Response) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId) {
      return res.status(400).json({ error: 'Menu Item ID required' });
    }

    const reviews = await prisma.review.findMany({
      where: {
        menuItemId: String(menuItemId),
        isHidden: false,
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = reviews.length;
    const totalScore = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalCount > 0 ? Number((totalScore / totalCount).toFixed(1)) : 0;

    return res.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewerName: r.user?.name || 'Verified Customer',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      averageRating,
      totalCount,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
  }
};

/**
 * Public: Get curated testimonials for homepage display
 * GET /api/reviews/testimonials
 */
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await prisma.review.findMany({
      where: {
        isHidden: false,
        rating: { gte: 4 },
        comment: { not: null },
      },
      include: {
        user: { select: { name: true } },
        menuItem: { select: { name: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const formatted = testimonials
      .filter((t) => t.comment && t.comment.trim().length > 0)
      .map((t) => ({
        id: t.id,
        customerName: t.user?.name || 'Verified Customer',
        dishName: t.menuItem?.name || 'Specialty Dish',
        dishImage: t.menuItem?.imageUrl,
        rating: t.rating,
        comment: t.comment,
        createdAt: t.createdAt,
      }));

    return res.json({
      success: true,
      testimonials: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch testimonials' });
  }
};

/**
 * Admin: List all reviews with filters
 * GET /api/admin/reviews
 */
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const { rating, menuItemId, search } = req.query;

    const whereClause: any = {};

    if (rating) {
      whereClause.rating = Number(rating);
    }
    if (menuItemId && typeof menuItemId === 'string') {
      whereClause.menuItemId = menuItemId;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { menuItem: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        menuItem: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true, bookingDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      reviews,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin reviews' });
  }
};

/**
 * Admin: Toggle isHidden status (soft delete)
 * PATCH /api/admin/reviews/:id/hide
 */
export const toggleHideReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isHidden: !review.isHidden },
      include: {
        user: { select: { name: true } },
        menuItem: { select: { name: true } },
      },
    });

    return res.json({
      success: true,
      message: `Review ${updated.isHidden ? 'hidden' : 'unhidden'} successfully`,
      review: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to toggle review visibility' });
  }
};

/**
 * Admin: Hard delete review
 * DELETE /api/admin/reviews/:id
 */
export const deleteReviewAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Review permanently deleted',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete review' });
  }
};
