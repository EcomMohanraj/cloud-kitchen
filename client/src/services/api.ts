const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

// Fallback South Indian Menu Catalog
const FALLBACK_MENU_ITEMS = [
  // BREAKFAST
  {
    id: 'b1',
    name: 'Chettinad Idli Platter',
    nameTamil: 'செட்டிநாடு இட்லி பிளேட்டர்',
    description: '4 Soft steaming Malligai Idlis served with 3 traditional chutneys & homemade sambar.',
    price: 80,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice, Urad Dal, Ghee, Coconut Chutney, Tomato Chutney, Sambar',
    prepTimeMinutes: 15,
    isVeg: true,
  },
  {
    id: 'b2',
    name: 'Crispy Ghee Podi Roast Dosa',
    nameTamil: 'நெய் பொடி தோசை',
    description: 'Golden crispy rice crepe sprinkled with hand-ground spicy podi and pure cow ghee.',
    price: 110,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Pure Cow Ghee, Gunpowder Podi, Coconut Chutney',
    prepTimeMinutes: 15,
    isVeg: true,
  },
  {
    id: 'b3',
    name: 'Medhu Vada (2 Pcs)',
    nameTamil: 'மெது வடை',
    description: 'Crispy deep-fried golden lentil fritters spiced with black pepper, ginger, and curry leaves.',
    price: 50,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Urad Dal, Black Pepper, Fresh Ginger, Curry Leaves, Coconut Chutney',
    prepTimeMinutes: 10,
    isVeg: true,
  },
  {
    id: 'b4',
    name: 'Traditional Rava Kichadi',
    nameTamil: 'ரவா கிச்சடி',
    description: 'Roasted semolina cooked with fresh green peas, carrots, cashews, and aromatic ghee.',
    price: 75,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rava, Vegetables, Cashews, Ghee, Mustard Seeds, Green Chilies',
    prepTimeMinutes: 15,
    isVeg: true,
  },

  // SNACKS & BREAK
  {
    id: 's1',
    name: 'Madurai Kara Murukku & Filter Coffee',
    nameTamil: 'கார முறுக்கு & ஃபில்டர் காபி',
    description: 'Crunchy traditional rice flour murukku paired with authentic Kumbakonam brass filter coffee.',
    price: 90,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Sesame, Spices, Roasted Coffee Decoction, Fresh Milk',
    prepTimeMinutes: 10,
    isVeg: true,
  },
  {
    id: 's2',
    name: 'Crispy Onion Pakoda',
    nameTamil: 'வெங்காய பகோடா',
    description: 'Thinly sliced crispy fried onion fritters seasoned with fennel seeds and curry leaves.',
    price: 60,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Onions, Besan, Rice Flour, Fennel, Green Chilies',
    prepTimeMinutes: 15,
    isVeg: true,
  },
  {
    id: 's3',
    name: 'Vazhaipoo Cutlet (Banana Flower Cutlet)',
    nameTamil: 'வாழைப்பூ கட்லெட்',
    description: 'Healthy minced banana blossom patties pan-fried to crispy golden perfection.',
    price: 85,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Banana Flower, Potato, Fennel, Breadcrumbs, Spices',
    prepTimeMinutes: 20,
    isVeg: true,
  },
  {
    id: 's4',
    name: 'Chana Sundaal & Tea Combo',
    nameTamil: 'சுண்டல் & டீ',
    description: 'Spiced boiled chickpeas tempered with mustard, red chilies, and fresh grated coconut.',
    price: 50,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    ingredients: 'White Chickpeas, Coconut, Mustard Seeds, Curry Leaves, Chai',
    prepTimeMinutes: 10,
    isVeg: true,
  },

  // LUNCH
  {
    id: 'l1',
    name: 'Kongu Naattu Kozhi Briyani',
    nameTamil: 'கொங்கு நாட்டுக்கோழி பிரியாணி',
    description: 'Authentic Seeraga Samba rice briyani cooked with free-range country chicken and hand-pounded spices.',
    price: 240,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seeraga Samba Rice, Nattu Kozhi, Shallots, Ginger-Garlic, Mint, Ghee',
    prepTimeMinutes: 25,
    isVeg: false,
  },
  {
    id: 'l2',
    name: 'Traditional Tamil Nadu Meals Thali',
    nameTamil: 'தமிழ்நாடு பாரம்பரிய சாப்பாடு',
    description: 'Steamed Ponni rice served with Paruppu, Sambar, Rasam, Vatha Kuzhambu, Kootu, Poriyal, Appalam, & Payasam.',
    price: 160,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Ponni Rice, Sambar, Rasam, Vatha Kuzhambu, Poriyal, Kootu, Appalam, Curd',
    prepTimeMinutes: 20,
    isVeg: true,
  },
  {
    id: 'l3',
    name: 'Chettinad Fish Curry Meal',
    nameTamil: 'செட்டிநாடு மீன் குழம்பு',
    description: 'Spicy tangy seer fish curry cooked in authentic earthen pots with shallots and tamarind.',
    price: 260,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seer Fish, Tamarind, Shallots, Chettinad Spices, Steamed Rice',
    prepTimeMinutes: 25,
    isVeg: false,
  },
  {
    id: 'l4',
    name: 'Mushroom Biryani',
    nameTamil: 'காளான் பிரியாணி',
    description: 'Aromatic Seeraga Samba rice cooked with organic fresh mushrooms and fresh herbs.',
    price: 180,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Fresh Mushrooms, Seeraga Samba Rice, Mint, Whole Spices, Onion Raitha',
    prepTimeMinutes: 20,
    isVeg: true,
  },

  // DINNER
  {
    id: 'd1',
    name: 'Kothu Parotta Deluxe',
    nameTamil: 'கொத்து பரோட்டா',
    description: 'Flaky shredded parottas tossed on hot iron griddle with eggs, chicken gravy, onions, and green chilies.',
    price: 150,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Parotta, Eggs, Chicken Salna, Onions, Green Chilies, Pepper',
    prepTimeMinutes: 20,
    isVeg: false,
  },
  {
    id: 'd2',
    name: 'Madurai Bun Parotta (2 Pcs)',
    nameTamil: 'மதுரை பன் பரோட்டா',
    description: 'Thick, fluffy, soft bun-shaped golden fried parottas served with rich spicy Salna gravy.',
    price: 120,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Flour, Milk, Ghee, Spicy Salna Gravy, Onion Raitha',
    prepTimeMinutes: 20,
    isVeg: true,
  },
  {
    id: 'd3',
    name: 'Kal Dosa with Meen Kuzhambu / Sambar',
    nameTamil: 'கல் தோசை',
    description: 'Soft sponge-like thick dosas cooked on heavy iron tawa served with rich curry.',
    price: 100,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Fish Gravy / Sambar, Coconut Chutney',
    prepTimeMinutes: 15,
    isVeg: true,
  },
  {
    id: 'd4',
    name: 'Idiyappam with Coconut Milk (4 Pcs)',
    nameTamil: 'இடியாப்பம் தேங்காய்ப்பால்',
    description: 'Steamed delicate string hoppers served with sweet cardamom infused fresh coconut milk.',
    price: 90,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Fresh Coconut Milk, Cardamom, Sugar',
    prepTimeMinutes: 15,
    isVeg: true,
  },
];

// Helper to get local stored orders
function getStoredOrders(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('yazhisai_orders_store');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save local stored orders
function saveStoredOrders(orders: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('yazhisai_orders_store', JSON.stringify(orders));
  } catch (err) {
    console.error(err);
  }
}

// Service Helpers
export const ScheduleService = {
  getSchedule: (date?: string) => fetchApi(`/schedule${date ? `?date=${date}` : ''}`),
  toggleSchedule: (payload: any) => fetchApi('/schedule', { method: 'POST', body: JSON.stringify(payload) }),
};

export const MenuService = {
  getMenuItems: async (slot?: string, all = false) => {
    const formattedSlot = slot ? slot.toUpperCase() : '';
    try {
      const data = await fetchApi(`/menu?${formattedSlot ? `slot=${formattedSlot}&` : ''}${all ? 'all=true' : ''}`);
      if (data && data.items && data.items.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn('API fetch for menu failed, using fallback South Indian Catalog:', error);
    }

    const filtered = formattedSlot
      ? FALLBACK_MENU_ITEMS.filter((item) => item.slotCategory.toUpperCase() === formattedSlot)
      : FALLBACK_MENU_ITEMS;

    return { items: filtered };
  },
  createMenuItem: (data: any) => fetchApi('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (data: any) => fetchApi('/menu', { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) => fetchApi(`/menu?id=${id}`, { method: 'DELETE' }),
};

export const OrderService = {
  getOrders: async (filters?: { id?: string; date?: string; slot?: string }) => {
    let apiOrders: any[] = [];
    try {
      const params = new URLSearchParams();
      if (filters?.id) params.append('id', filters.id);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.slot && filters.slot !== 'ALL') params.append('slot', filters.slot);
      const data = await fetchApi(`/orders?${params.toString()}`);
      if (data && data.orders) apiOrders = data.orders;
    } catch (error) {
      console.warn('Backend Express getOrders failed, fallback to local store:', error);
    }

    const stored = getStoredOrders();

    // Merge API & local stored orders uniquely by ID
    const mergedMap = new Map();
    [...stored, ...apiOrders].forEach((ord) => {
      if (ord && ord.id) {
        mergedMap.set(ord.id, ord);
      }
    });

    let result = Array.from(mergedMap.values());

    if (filters?.id) {
      result = result.filter((o) => o.id === filters.id);
    }
    if (filters?.date) {
      result = result.filter((o) => o.bookingDate === filters.date);
    }
    if (filters?.slot && filters.slot !== 'ALL') {
      result = result.filter((o) => o.slotType === filters.slot);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return { orders: result };
  },

  createOrder: async (orderData: any) => {
    let createdOrder: any = null;
    try {
      const data = await fetchApi('/orders', { method: 'POST', body: JSON.stringify(orderData) });
      if (data && data.order) createdOrder = data.order;
    } catch (error) {
      console.warn('Backend Express createOrder failed, saving order locally:', error);
    }

    if (!createdOrder) {
      createdOrder = {
        id: `ord_${Math.random().toString(36).substring(2, 10)}`,
        orderNumber: `ORD-YZH-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        deliveryAddress: orderData.deliveryAddress,
        bookingDate: orderData.bookingDate,
        slotType: orderData.slotType,
        totalAmount: orderData.items?.reduce((sum: number, i: any) => sum + (i.unitPrice * i.quantity), 0) || 160,
        paymentMethod: orderData.paymentMethod || 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        items: orderData.items?.map((i: any, index: number) => ({
          id: `item_${index}`,
          menuItemName: i.menuItemName,
          quantity: i.quantity,
          totalPrice: i.unitPrice * i.quantity,
        })) || [],
        createdAt: new Date().toISOString(),
      };
    }

    // Save to local store
    const stored = getStoredOrders();
    saveStoredOrders([createdOrder, ...stored]);

    return { order: createdOrder };
  },

  updateOrderStatus: async (orderId: string, orderStatus?: string, paymentStatus?: string) => {
    try {
      await fetchApi('/orders', { method: 'PATCH', body: JSON.stringify({ orderId, orderStatus, paymentStatus }) });
    } catch (error) {
      console.warn('Backend Express updateOrderStatus failed, updating local store:', error);
    }

    // Update local store
    const stored = getStoredOrders();
    const updated = stored.map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          orderStatus: orderStatus || ord.orderStatus,
          paymentStatus: paymentStatus || ord.paymentStatus,
        };
      }
      return ord;
    });
    saveStoredOrders(updated);

    return { success: true };
  },
};

export const AuthService = {
  login: (credentials: any) => fetchApi('/auth', { method: 'POST', body: JSON.stringify(credentials) }),
  verifySession: () => fetchApi('/auth', { method: 'GET' }),
  logout: () => fetchApi('/auth', { method: 'DELETE' }),
};

export const PaymentService = {
  processPayment: (paymentData: any) => fetchApi('/payment', { method: 'POST', body: JSON.stringify(paymentData) }),
};
