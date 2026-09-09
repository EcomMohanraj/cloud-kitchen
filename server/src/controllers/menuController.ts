import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';

const menuItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  nameTamil: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  slotCategory: z.enum(['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER']),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(true),
  imageUrl: z.string().optional(),
  ingredients: z.string().optional(),
  prepTimeMinutes: z.number().int().positive().default(20),
});

// Authentic South Indian Food Catalog Seed Data
const DEFAULT_SOUTH_INDIAN_MENU = [
  // BREAKFAST
  {
    name: 'Chettinad Idli Platter',
    nameTamil: 'செட்டிநாடு இட்லி பிளேட்டர்',
    description: '4 Soft steaming Malligai Idlis served with 3 traditional chutneys & homemade sambar.',
    price: 80,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice, Urad Dal, Ghee, Coconut Chutney, Tomato Chutney, Sambar',
    prepTimeMinutes: 15,
  },
  {
    name: 'Crispy Ghee Podi Roast Dosa',
    nameTamil: 'நெய் பொடி தோசை',
    description: 'Golden crispy rice crepe sprinkled with hand-ground spicy podi and pure cow ghee.',
    price: 110,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Pure Cow Ghee, Gunpowder Podi, Coconut Chutney',
    prepTimeMinutes: 15,
  },
  {
    name: 'Medhu Vada (2 Pcs)',
    nameTamil: 'மெது வடை',
    description: 'Crispy deep-fried golden lentil fritters spiced with black pepper, ginger, and curry leaves.',
    price: 50,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Urad Dal, Black Pepper, Fresh Ginger, Curry Leaves, Coconut Chutney',
    prepTimeMinutes: 10,
  },
  {
    name: 'Traditional Rava Kichadi',
    nameTamil: 'ரவா கிச்சடி',
    description: 'Roasted semolina cooked with fresh green peas, carrots, cashews, and aromatic ghee.',
    price: 75,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rava, Vegetables, Cashews, Ghee, Mustard Seeds, Green Chilies',
    prepTimeMinutes: 15,
  },

  // SNACKS & BREAK
  {
    name: 'Madurai Kara Murukku & Filter Coffee',
    nameTamil: 'கார முறுக்கு & ஃபில்டர் காபி',
    description: 'Crunchy traditional rice flour murukku paired with authentic Kumbakonam brass filter coffee.',
    price: 90,
    slotCategory: 'SNACKS',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Sesame, Spices, Roasted Coffee Decoction, Fresh Milk',
    prepTimeMinutes: 10,
  },
  {
    name: 'Crispy Onion Pakoda',
    nameTamil: 'வெங்காய பகோடா',
    description: 'Thinly sliced crispy fried onion fritters seasoned with fennel seeds and curry leaves.',
    price: 60,
    slotCategory: 'SNACKS',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Onions, Besan, Rice Flour, Fennel, Green Chilies',
    prepTimeMinutes: 15,
  },
  {
    name: 'Vazhaipoo Cutlet (Banana Flower Cutlet)',
    nameTamil: 'வாழைப்பூ கட்லெட்',
    description: 'Healthy minced banana blossom patties pan-fried to crispy golden perfection.',
    price: 85,
    slotCategory: 'SNACKS',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Banana Flower, Potato, Fennel, Breadcrumbs, Spices',
    prepTimeMinutes: 20,
  },
  {
    name: 'Chana Sundaal & Tea Combo',
    nameTamil: 'சுண்டல் & டீ',
    description: 'Spiced boiled chickpeas tempered with mustard, red chilies, and fresh grated coconut.',
    price: 50,
    slotCategory: 'SNACKS',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    ingredients: 'White Chickpeas, Coconut, Mustard Seeds, Curry Leaves, Chai',
    prepTimeMinutes: 10,
  },

  // LUNCH
  {
    name: 'Kongu Naattu Kozhi Briyani',
    nameTamil: 'கொங்கு நாட்டுக்கோழி பிரியாணி',
    description: 'Authentic Seeraga Samba rice briyani cooked with free-range country chicken and hand-pounded spices.',
    price: 240,
    slotCategory: 'LUNCH',
    isAvailable: true,
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seeraga Samba Rice, Nattu Kozhi, Shallots, Ginger-Garlic, Mint, Ghee',
    prepTimeMinutes: 25,
  },
  {
    name: 'Traditional Tamil Nadu Meals Thali',
    nameTamil: 'தமிழ்நாடு பாரம்பரிய சாப்பாடு',
    description: 'Steamed Ponni rice served with Paruppu, Sambar, Rasam, Vatha Kuzhambu, Kootu, Poriyal, Appalam, & Payasam.',
    price: 160,
    slotCategory: 'LUNCH',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Ponni Rice, Sambar, Rasam, Vatha Kuzhambu, Poriyal, Kootu, Appalam, Curd',
    prepTimeMinutes: 20,
  },
  {
    name: 'Chettinad Fish Curry Meal',
    nameTamil: 'செட்டிநாடு மீன் குழம்பு',
    description: 'Spicy tangy seer fish curry cooked in authentic earthen pots with shallots and tamarind.',
    price: 260,
    slotCategory: 'LUNCH',
    isAvailable: true,
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seer Fish, Tamarind, Shallots, Chettinad Spices, Steamed Rice',
    prepTimeMinutes: 25,
  },
  {
    name: 'Mushroom Biryani',
    nameTamil: 'காளான் பிரியாணி',
    description: 'Aromatic Seeraga Samba rice cooked with organic fresh mushrooms and fresh herbs.',
    price: 180,
    slotCategory: 'LUNCH',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Fresh Mushrooms, Seeraga Samba Rice, Mint, Whole Spices, Onion Raitha',
    prepTimeMinutes: 20,
  },

  // DINNER
  {
    name: 'Kothu Parotta Deluxe',
    nameTamil: 'கொத்து பரோட்டா',
    description: 'Flaky shredded parottas tossed on hot iron griddle with eggs, chicken gravy, onions, and green chilies.',
    price: 150,
    slotCategory: 'DINNER',
    isAvailable: true,
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Parotta, Eggs, Chicken Salna, Onions, Green Chilies, Pepper',
    prepTimeMinutes: 20,
  },
  {
    name: 'Madurai Bun Parotta (2 Pcs)',
    nameTamil: 'மதுரை பன் பரோட்டா',
    description: 'Thick, fluffy, soft bun-shaped golden fried parottas served with rich spicy Salna gravy.',
    price: 120,
    slotCategory: 'DINNER',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Flour, Milk, Ghee, Spicy Salna Gravy, Onion Raitha',
    prepTimeMinutes: 20,
  },
  {
    name: 'Kal Dosa with Meen Kuzhambu / Sambar',
    nameTamil: 'கல் தோசை',
    description: 'Soft sponge-like thick dosas cooked on heavy iron tawa served with rich curry.',
    price: 100,
    slotCategory: 'DINNER',
    isAvailable: true,
    isVeg: false,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Fish Gravy / Sambar, Coconut Chutney',
    prepTimeMinutes: 15,
  },
  {
    name: 'Idiyappam with Coconut Milk (4 Pcs)',
    nameTamil: 'இடியாப்பம் தேங்காய்ப்பால்',
    description: 'Steamed delicate string hoppers served with sweet cardamom infused fresh coconut milk.',
    price: 90,
    slotCategory: 'DINNER',
    isAvailable: true,
    isVeg: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Fresh Coconut Milk, Cardamom, Sugar',
    prepTimeMinutes: 15,
  },
];

async function ensureMenuSeed() {
  const count = await prisma.menuItem.count();
  if (count > 0) return;

  for (const item of DEFAULT_SOUTH_INDIAN_MENU) {
    await prisma.menuItem.create({
      data: item as any,
    });
  }
}

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    await ensureMenuSeed();

    const { slot, all } = req.query;
    const includeInactive = all === 'true';

    const whereClause: any = {};
    if (slot && typeof slot === 'string') {
      whereClause.slotCategory = { equals: slot.trim(), mode: 'insensitive' };
    }
    if (!includeInactive) {
      whereClause.isAvailable = true;
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ items });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch menu' });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const validated = menuItemSchema.parse(req.body);

    const newItem = await prisma.menuItem.create({
      data: validated,
    });

    return res.json({ success: true, item: newItem });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to create menu item' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id, ...data } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    const updated = await prisma.menuItem.update({
      where: { id: String(id) },
      data,
    });

    return res.json({ success: true, item: updated });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update menu item' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Menu item ID is required' });
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to delete menu item' });
  }
};
