const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

if (typeof window !== 'undefined') {
  console.log(`🌐 [Yazhisai API Engine] Active API Base URL: ${API_BASE_URL}`);
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('rider_token') ||
      localStorage.getItem('yazhisai_admin_jwt') ||
      localStorage.getItem('admin_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

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
    ingredients: 'Fermented Batter, Cow Ghee, Gunpowder Podi, Sambar, Coconut Chutney',
    prepTimeMinutes: 20,
    isVeg: true,
  },
  {
    id: 'b3',
    name: 'Medhu Vada Platter (2 Pcs)',
    nameTamil: 'மெது வடை பிளேட்டர்',
    description: 'Crispy golden lentil fritters spiced with black pepper, ginger, and green chillies.',
    price: 50,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Urad Dal, Black Pepper, Ginger, Curry Leaves, Coconut Chutney',
    prepTimeMinutes: 10,
    isVeg: true,
  },
  {
    id: 'b4',
    name: 'Traditional Rava Kichadi',
    nameTamil: 'ரவா கிச்சடி',
    description: 'Semolina cooked with fresh vegetables, cashews, mustard seeds, and pure ghee.',
    price: 75,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rava, Vegetables, Cashews, Ghee, Mustard, Tomato Chutney',
    prepTimeMinutes: 15,
    isVeg: true,
  },

  // SNACKS
  {
    id: 's1',
    name: 'Madurai Kara Murukku & Filter Coffee',
    nameTamil: 'கார முறுக்கு & டிகிரி காபி',
    description: 'Crunchy rice flour spiraled savouries paired with aromatic Kumbakonam filter coffee.',
    price: 90,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Butter, Spices, Pure Milk Coffee Extract',
    prepTimeMinutes: 10,
    isVeg: true,
  },
  {
    id: 's2',
    name: 'Crispy Onion Pakoda',
    nameTamil: 'வெங்காய பகோடா',
    description: 'Thin sliced shallots fried golden in spiced chickpea batter served with mint chutney.',
    price: 60,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Onions, Besan, Rice Flour, Chillies, Mint Chutney',
    prepTimeMinutes: 12,
    isVeg: true,
  },

  // LUNCH
  {
    id: 'l1',
    name: 'Kongu Naattu Kozhi Briyani',
    nameTamil: 'கொங்கு நாட்டுக்கோழி பிரியாணி',
    description: 'Fragrant Seeraga Samba rice cooked with free-range country chicken and ground spices.',
    price: 240,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seeraga Samba Rice, Country Chicken, Cow Ghee, Onion Pachadi',
    prepTimeMinutes: 30,
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
  getOrders: async (filters?: { id?: string; date?: string; slot?: string; phone?: string }) => {
    let apiOrders: any[] = [];
    let fetchFailed = false;
    try {
      const params = new URLSearchParams();
      if (filters?.id) params.append('id', filters.id);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.slot && filters.slot !== 'ALL') params.append('slot', filters.slot);
      if (filters?.phone) params.append('phone', filters.phone);
      const data = await fetchApi(`/orders?${params.toString()}`);
      if (data && data.orders) apiOrders = data.orders;
      console.log(`🌐 [api.ts OrderService.getOrders] fetchApi returned ${apiOrders.length} orders for filters:`, filters);
    } catch (error) {
      fetchFailed = true;
      console.warn('❌ [api.ts OrderService.getOrders] Backend Express getOrders failed, fallback to local store:', error);
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
    if (filters?.phone) {
      result = result.filter((o) => o.customerPhone === filters.phone);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    console.log(`📊 [api.ts OrderService.getOrders] Returning total ${result.length} orders (fetchFailed=${fetchFailed})`);

    return { orders: result, fetchFailed };
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
  loginAdmin: (credentials: any) => fetchApi('/auth', { method: 'POST', body: JSON.stringify(credentials) }),
  registerCustomer: (payload: { name: string; phone: string; email?: string; address?: string }) =>
    fetchApi('/auth/customer/register', { method: 'POST', body: JSON.stringify(payload) }),
  loginCustomer: (payload: { email?: string; phone?: string; name?: string; password?: string }) =>
    fetchApi('/auth/customer/login', { method: 'POST', body: JSON.stringify(payload) }),
  verifySession: () => fetchApi('/auth', { method: 'GET' }),
  logout: () => fetchApi('/auth', { method: 'DELETE' }),
  logoutAdmin: () => fetchApi('/auth', { method: 'DELETE' }),
};

export const PaymentService = {
  createRazorpayOrder: (amount: number, orderId?: string) =>
    fetchApi('/payment/create-order', { method: 'POST', body: JSON.stringify({ amount, orderId }) }),
  verifyPayment: (payload: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    fetchApi('/payment/verify', { method: 'POST', body: JSON.stringify(payload) }),
  processPayment: (paymentData: any) => fetchApi('/payment', { method: 'POST', body: JSON.stringify(paymentData) }),
};

export const AddressService = {
  getAddresses: (phone: string) => fetchApi(`/addresses?phone=${encodeURIComponent(phone)}`),
  createAddress: (payload: { phone: string; label?: string; fullAddress: string; isDefault?: boolean }) =>
    fetchApi('/addresses', { method: 'POST', body: JSON.stringify(payload) }),
  updateAddress: (id: string, payload: { phone: string; label?: string; fullAddress: string; isDefault?: boolean }) =>
    fetchApi(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAddress: (id: string, phone: string) =>
    fetchApi(`/addresses/${id}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' }),
  setDefaultAddress: (id: string, phone: string) =>
    fetchApi(`/addresses/${id}/default`, { method: 'PUT', body: JSON.stringify({ phone }) }),
  updateProfile: (phone: string, name: string) =>
    fetchApi('/addresses/profile', { method: 'PUT', body: JSON.stringify({ phone, name }) }),
};

export const RiderService = {
  login: (credentials: { phone: string; password?: string }) =>
    fetchApi('/rider/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getAvailableOrders: () => fetchApi('/rider/available-orders'),
  acceptOrder: (orderId: string) =>
    fetchApi(`/rider/orders/${orderId}/accept`, { method: 'POST' }),
  updateOrderStatus: (orderId: string, orderStatus: string) =>
    fetchApi(`/rider/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ orderStatus }) }),
  getMyOrders: () => fetchApi('/rider/my-orders'),
  getRiderLocation: (orderId: string) => fetchApi(`/rider/location/${orderId}`),
};
