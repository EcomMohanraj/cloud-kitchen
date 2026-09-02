import { z } from 'zod';

// ============================================================================
// 1. AUTHENTICATION & PROFILE VALIDATION SCHEMAS
// ============================================================================

export const CustomerProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full Name must be at least 2 characters long' })
    .max(50, { message: 'Full Name cannot exceed 50 characters' }),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9' }),
});

export const AdminAuthSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

// ============================================================================
// 2. ORDER CRUD VALIDATION SCHEMA
// ============================================================================

export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1, { message: 'Menu Item ID is required' }),
  menuItemName: z.string().min(1, { message: 'Menu Item Name is required' }),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
  unitPrice: z.number().min(0, { message: 'Unit Price cannot be negative' }),
});

export const CheckoutOrderSchema = z.object({
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  customerPhone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Valid 10-digit mobile number required' }),
  deliveryAddress: z.string().min(10, { message: 'Delivery address must be at least 10 characters long' }),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Booking date must be in YYYY-MM-DD format' }),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER'], { message: 'Invalid meal slot selected' }),
  preferredTime: z.string().optional(),
  paymentMethod: z.enum(['COD', 'ONLINE'], { message: 'Invalid payment method' }),
  items: z.array(OrderItemSchema).min(1, { message: 'Your tray must contain at least 1 menu item to checkout' }),
});

// ============================================================================
// 3. MENU ITEM CRUD VALIDATION SCHEMA
// ============================================================================

export const MenuItemCRUDSchema = z.object({
  name: z.string().min(3, { message: 'Dish name must be at least 3 characters long' }),
  nameTamil: z.string().optional(),
  description: z.string().min(5, { message: 'Description must be at least 5 characters long' }),
  price: z.number().positive({ message: 'Price must be greater than ₹0' }),
  categorySlot: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER'], { message: 'Invalid slot category' }),
  isVeg: z.boolean(),
  imageUrl: z.string().url({ message: 'Must be a valid image URL' }).optional().or(z.literal('')),
  prepTimeMinutes: z.number().int().min(5, { message: 'Preparation time must be at least 5 minutes' }),
});

// ============================================================================
// 4. KITCHEN SLOT SCHEDULE MATRIX CRUD VALIDATION SCHEMA
// ============================================================================

export const SlotScheduleCRUDSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
  slotType: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER'], { message: 'Invalid slot category' }),
  isAvailable: z.boolean(),
  maxCapacity: z.number().int().min(1, { message: 'Max capacity must be at least 1 order' }).max(200, { message: 'Max capacity capped at 200' }),
});

// Inferred TypeScript Types from Zod Schemas
export type CustomerProfileInput = z.infer<typeof CustomerProfileSchema>;
export type AdminAuthInput = z.infer<typeof AdminAuthSchema>;
export type CheckoutOrderInput = z.infer<typeof CheckoutOrderSchema>;
export type MenuItemCRUDInput = z.infer<typeof MenuItemCRUDSchema>;
export type SlotScheduleCRUDInput = z.infer<typeof SlotScheduleCRUDSchema>;
