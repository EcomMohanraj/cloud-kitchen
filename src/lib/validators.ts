import { z } from 'zod';

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Invalid menu item'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Enter a valid 10-digit phone number').max(15),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER', 'VEGETABLES']),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
});

export const scheduleToggleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER', 'VEGETABLES']),
  isActive: z.boolean(),
  maxCapacity: z.number().int().min(1).optional(),
  cutoffTime: z.string().optional(),
});

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  nameTamil: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  slotCategory: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER', 'VEGETABLES']),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url('Invalid image URL').optional(),
  ingredients: z.string().optional(),
  prepTimeMinutes: z.number().int().positive().default(20),
});
