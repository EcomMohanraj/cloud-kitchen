import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

// POST /api/admin/chefs - Create new Chef account
export const createChef = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const existingChef = await prisma.chef.findUnique({
      where: { phone: phone.trim() },
    });

    if (existingChef) {
      return res.status(400).json({ error: 'A chef with this phone number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const chef = await prisma.chef.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, chef });
  } catch (error: any) {
    console.error('Admin create chef error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create chef account.' });
  }
};

// GET /api/admin/chefs - List all chefs
export const getAllChefs = async (req: AuthRequest, res: Response) => {
  try {
    const chefs = await prisma.chef.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, chefs });
  } catch (error: any) {
    console.error('Admin get chefs error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch kitchen chefs.' });
  }
};

// PATCH /api/admin/chefs/:id - Toggle chef active status (deactivate/reactivate)
export const updateChefActiveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existingChef = await prisma.chef.findUnique({
      where: { id },
    });

    if (!existingChef) {
      return res.status(404).json({ error: 'Chef not found.' });
    }

    const newActiveState = typeof isActive === 'boolean' ? isActive : !existingChef.isActive;

    const updatedChef = await prisma.chef.update({
      where: { id },
      data: { isActive: newActiveState },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      chef: updatedChef,
      message: `Chef ${updatedChef.name} is now ${updatedChef.isActive ? 'Active' : 'Deactivated'}.`,
    });
  } catch (error: any) {
    console.error('Admin update chef status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update chef status.' });
  }
};

// GET /api/admin/chefs/:id/orders - Order history for one chef with optional date range
export const getChefOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const chef = await prisma.chef.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true, isActive: true, createdAt: true },
    });

    if (!chef) {
      return res.status(404).json({ error: 'Chef not found.' });
    }

    const whereClause: any = {
      preparedByChefId: id,
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate && typeof startDate === 'string') dateFilter.gte = startDate;
      if (endDate && typeof endDate === 'string') dateFilter.lte = endDate;
      whereClause.bookingDate = dateFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, chef, orders });
  } catch (error: any) {
    console.error('Admin get chef orders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch chef order history.' });
  }
};

