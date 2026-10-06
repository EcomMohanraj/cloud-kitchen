const API_BASE_URL = (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production')
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

if (typeof window !== 'undefined') {
  console.log(`🌐 [Yazhisai API Engine] Active API Base URL: ${API_BASE_URL}`);
}

let isRedirectingFor401 = false;

function handle401SessionExpiry(endpoint: string): boolean {
  if (typeof window === 'undefined') return false;

  // Do NOT trigger session expiry redirects for login/auth submission attempts themselves
  if (
    endpoint === '/auth' ||
    endpoint.endsWith('/auth') ||
    endpoint.includes('/login') ||
    endpoint.includes('/send-otp') ||
    endpoint.includes('/verify-otp') ||
    endpoint.includes('/register')
  ) {
    return false;
  }

  const currentPath = window.location.pathname;

  // 1. Admin Session Expired
  if (currentPath.startsWith('/admin') || endpoint.includes('/admin')) {
    if (currentPath === '/admin/login') return false;
    if (!isRedirectingFor401) {
      isRedirectingFor401 = true;
      console.warn('🔒 [API Security] Admin session expired (401). Redirecting to Admin Login...');
      const targetUrl = `/admin/login?sessionExpired=true&redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = targetUrl;
    }
    return true;
  }

  // 2. Chef Session Expired
  if (currentPath.startsWith('/chef') || endpoint.includes('/chef')) {
    if (currentPath === '/chef/login') return false;
    if (!isRedirectingFor401) {
      isRedirectingFor401 = true;
      localStorage.removeItem('chef_info');
      console.warn('🔒 [API Security] Chef session expired (401). Redirecting to Chef Login...');
      const targetUrl = `/chef/login?sessionExpired=true&redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = targetUrl;
    }
    return true;
  }

  // 3. Delivery Partner (Rider) Session Expired
  if (currentPath.startsWith('/rider') || endpoint.includes('/rider')) {
    if (currentPath === '/rider/login') return false;
    if (!isRedirectingFor401) {
      isRedirectingFor401 = true;
      localStorage.removeItem('rider_info');
      console.warn('🔒 [API Security] Rider session expired (401). Redirecting to Rider Login...');
      const targetUrl = `/rider/login?sessionExpired=true&redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = targetUrl;
    }
    return true;
  }

  // 4. Customer Session Expired
  // Do NOT force a hard page redirect; keep active cartStore completely intact.
  // Dispatch custom window event so Navbar / Checkout Modal can open sign-in prompt smoothly.
  console.warn('🔒 [API Security] Customer session expired (401). Prompting sign-in without wiping cart...');
  window.dispatchEvent(new CustomEvent('customer-session-expired', {
    detail: { message: 'Your session expired. Please sign in again.' },
  }));
  return false;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
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
    if (response.status === 401) {
      const isRedirecting = handle401SessionExpiry(endpoint);
      if (isRedirecting || isRedirectingFor401) {
        // Return pending promise to suppress secondary double-error messages/modals while redirecting
        return new Promise(() => {});
      }
    }
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

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
  // Throws on failure so callers can show a real error state (no fake fallback menu)
  getMenuItems: async (slot?: string, all = false) => {
    const formattedSlot = slot ? slot.toUpperCase() : '';
    const data = await fetchApi(`/menu?${formattedSlot ? `slot=${formattedSlot}&` : ''}${all ? 'all=true' : ''}`);
    return { ...data, items: Array.isArray(data?.items) ? data.items : [] };
  },
  createMenuItem: (data: any) => fetchApi('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (data: any) => fetchApi('/menu', { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) => fetchApi(`/menu?id=${id}`, { method: 'DELETE' }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetchApi('/admin/upload-image', {
      method: 'POST',
      body: formData,
    });
  },
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
      if (data && Array.isArray(data.orders)) {
        apiOrders = data.orders;
      } else if (data && data.order) {
        apiOrders = [data.order];
      }
      console.log(`🌐 [api.ts OrderService.getOrders] fetchApi returned ${apiOrders.length} orders for filters:`, filters);
    } catch (error) {
      fetchFailed = true;
      console.warn('❌ [api.ts OrderService.getOrders] Backend Express getOrders failed, fallback to local store:', error);
    }

    let result: any[] = [];
    if (!fetchFailed) {
      // API call succeeded — use live DB orders as single source of truth
      result = apiOrders;
      if (!filters?.date && !filters?.slot && !filters?.id && !filters?.phone) {
        saveStoredOrders(apiOrders);
      }
    } else {
      // Offline fallback: use stored orders from localStorage only when API fails
      const stored = getStoredOrders();
      result = stored;
    }

    if (filters?.id) {
      const q = filters.id.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id === filters.id ||
          o.orderNumber === filters.id ||
          (o.id && o.id.toLowerCase() === q) ||
          (o.orderNumber && o.orderNumber.toLowerCase() === q)
      );
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

    // Exclude unconfirmed PAYMENT_PENDING / PAYMENT_FAILED orders from general list views
    if (!filters?.id) {
      result = result.filter((o) => o.orderStatus !== 'PAYMENT_PENDING' && o.orderStatus !== 'PAYMENT_FAILED');
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    console.log(`📊 [api.ts OrderService.getOrders] Returning total ${result.length} orders (fetchFailed=${fetchFailed})`);

    return { orders: result, fetchFailed };
  },

  // Throws with the server's real error message on failure — never fabricates a local order
  createOrder: async (orderData: any) => {
    let data: any;
    try {
      data = await fetchApi('/orders', { method: 'POST', body: JSON.stringify(orderData) });
    } catch (error: any) {
      // Network failure (TypeError) or non-JSON gateway error page (SyntaxError) from a down/waking server
      if (error instanceof TypeError || error instanceof SyntaxError) {
        throw new Error('Could not reach the kitchen server. Please check your connection and try again.');
      }
      throw error;
    }

    const createdOrder = data?.order;
    if (!createdOrder) {
      throw new Error('The server did not confirm your order. Please try again.');
    }

    // Only save to local store if order is confirmed (not PAYMENT_PENDING or PAYMENT_FAILED)
    if (createdOrder.orderStatus !== 'PAYMENT_PENDING' && createdOrder.orderStatus !== 'PAYMENT_FAILED') {
      const stored = getStoredOrders();
      saveStoredOrders([createdOrder, ...stored]);
    }

    return { order: createdOrder };
  },

  updateOrderStatus: async (orderId: string, orderStatus?: string, paymentStatus?: string, cancelReason?: string) => {
    try {
      await fetchApi('/orders', { method: 'PATCH', body: JSON.stringify({ orderId, orderStatus, paymentStatus, cancelReason }) });
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

  markCashCollected: async (orderId: string) => {
    try {
      return await fetchApi(`/orders/${orderId}/mark-cash-collected`, { method: 'PATCH' });
    } catch (error: any) {
      console.warn('Backend markCashCollected failed, using fallback status update:', error);
      return OrderService.updateOrderStatus(orderId, undefined, 'PAID');
    }
  },

  // ── Public tracking fetch (no auth required) ───────────────────────────────
  // Used exclusively by /track/[orderId] page. Calls the public
  // GET /api/orders/track/:orderNumber endpoint which requires no JWT.
  //
  // On success:  returns fresh DB data directly — NO localStorage merge.
  //              Stale cached status can NEVER override the live DB value.
  // On failure:  falls back to localStorage (genuine network/server outage only).
  getOrderForTracking: async (orderNumber: string): Promise<{ order: any | null; fromCache: boolean }> => {
    try {
      const data = await fetchApi(`/orders/track/${encodeURIComponent(orderNumber)}`);
      const order = data?.order || null;

      if (order) {
        console.log(`✅ [api.ts getOrderForTracking] Fresh DB status for ${orderNumber}: ${order.orderStatus}`);
        // Update localStorage so background polls start from the correct status
        const stored = getStoredOrders();
        const map = new Map(stored.map((o: any) => [o.id, o]));
        if (order.id) map.set(order.id, { ...(map.get(order.id) || {}), ...order });
        saveStoredOrders(Array.from(map.values()));
        return { order, fromCache: false };
      }

      return { order: null, fromCache: false };
    } catch (error: any) {
      console.warn(
        `⚠️ [api.ts getOrderForTracking] API failed for ${orderNumber}, falling back to localStorage:`,
        error.message
      );

      // Only fall back to localStorage on a genuine API failure (network down, 5xx)
      const stored = getStoredOrders();
      const q = orderNumber.trim().toLowerCase();
      const cached = stored.find(
        (o: any) =>
          o.orderNumber === orderNumber ||
          o.id === orderNumber ||
          (o.orderNumber && o.orderNumber.toLowerCase() === q)
      );
      return { order: cached || null, fromCache: true };
    }
  },
};

export const AuthService = {
  login: (credentials: any) => fetchApi('/auth', { method: 'POST', body: JSON.stringify(credentials) }),
  loginAdmin: (credentials: any) => fetchApi('/auth', { method: 'POST', body: JSON.stringify(credentials) }),
  sendCustomerOtp: (payload: { phone: string; name?: string; address?: string }) =>
    fetchApi('/auth/customer/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyCustomerOtp: (payload: { phone: string; otp: string; name?: string; address?: string }) =>
    fetchApi('/auth/customer/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  registerCustomer: (payload: { name: string; phone: string; email?: string; password?: string; address?: string }) =>
    fetchApi('/auth/customer/register', { method: 'POST', body: JSON.stringify(payload) }),
  loginCustomer: (payload: { email?: string; phone?: string; name?: string; password?: string }) =>
    fetchApi('/auth/customer/login', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: { email: string }) =>
    fetchApi('/auth/customer/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    fetchApi('/auth/customer/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifySession: () => fetchApi('/auth', { method: 'GET' }),
  logout: () => fetchApi('/auth', { method: 'DELETE' }),
  logoutAdmin: () => fetchApi('/auth', { method: 'DELETE' }),
  setup2FA: () => fetchApi('/admin/2fa/setup', { method: 'POST' }),
  verify2FASetup: (code: string) => fetchApi('/admin/2fa/verify-setup', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2FA: () => fetchApi('/admin/2fa/disable', { method: 'POST' }),
  get2FAStatus: () => fetchApi('/admin/2fa/status', { method: 'GET' }),
  loginVerify2FA: (tempToken: string, code: string) => fetchApi('/admin/2fa/login-verify', { method: 'POST', body: JSON.stringify({ tempToken, code }) }),
};

export const PaymentService = {
  createRazorpayOrder: (amount: number, orderId?: string) =>
    fetchApi('/payment/create-order', { method: 'POST', body: JSON.stringify({ amount, orderId }) }),
  verifyPayment: (payload: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    fetchApi('/payment/verify', { method: 'POST', body: JSON.stringify(payload) }),
  cancelPayment: (orderId: string) =>
    fetchApi('/payment/cancel', { method: 'POST', body: JSON.stringify({ orderId }) }),
};

export const AddressService = {
  getAddresses: (phone: string) => fetchApi(`/addresses?phone=${encodeURIComponent(phone)}`),
  createAddress: (payload: { phone: string; label?: string; fullAddress: string; latitude?: number; longitude?: number; isDefault?: boolean }) =>
    fetchApi('/addresses', { method: 'POST', body: JSON.stringify(payload) }),
  updateAddress: (id: string, payload: { phone: string; label?: string; fullAddress: string; latitude?: number; longitude?: number; isDefault?: boolean }) =>
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
  getDeliveryHistory: (date?: string) =>
    fetchApi(`/rider/delivery-history${date ? `?date=${encodeURIComponent(date)}` : ''}`),
};

export const AdminRiderService = {
  createRider: (payload: { name: string; phone: string; password: string }) =>
    fetchApi('/admin/riders', { method: 'POST', body: JSON.stringify(payload) }),
  getAllRiders: () => fetchApi('/admin/riders'),
  getRiderOrders: (riderId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const q = params.toString();
    return fetchApi(`/admin/riders/${riderId}/orders${q ? `?${q}` : ''}`);
  },
  updateRiderStatus: (riderId: string, isActive: boolean) =>
    fetchApi(`/admin/riders/${riderId}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
};

export const ReviewService = {
  createReview: (payload: { userId?: string; phone?: string; orderId: string; menuItemId: string; rating: number; comment?: string }) =>
    fetchApi('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getMenuItemReviews: (menuItemId: string) =>
    fetchApi(`/reviews/menu-item/${menuItemId}`),
  getTestimonials: () =>
    fetchApi('/reviews/testimonials'),
  getAdminReviews: (filters?: { rating?: number; menuItemId?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.rating) params.append('rating', String(filters.rating));
    if (filters?.menuItemId) params.append('menuItemId', filters.menuItemId);
    if (filters?.search) params.append('search', filters.search);
    return fetchApi(`/reviews/admin/all?${params.toString()}`);
  },
  toggleHideReview: (id: string) =>
    fetchApi(`/reviews/admin/${id}/hide`, { method: 'PATCH' }),
  deleteReview: (id: string) =>
    fetchApi(`/reviews/admin/${id}`, { method: 'DELETE' }),
};

export const SettingsService = {
  getStoreSettings: () => fetchApi('/settings'),
  updateStoreSettings: (settings: {
    defaultDeliveryFee?: number;
    enableDeliveryFee?: boolean;
    defaultPackingFee?: number;
    enablePackingFee?: boolean;
    minOrderValue?: number;
  }) =>
    fetchApi('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

export const AnalyticsService = {
  getRevenueAnalytics: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return fetchApi(`/admin/analytics/revenue${queryString ? `?${queryString}` : ''}`);
  },
};

export const ChefService = {
  login: (credentials: { phone: string; password: string }) =>
    fetchApi('/chef/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getLiveOrders: () => fetchApi('/chef/live-orders'),
  acceptOrder: (orderId: string) =>
    fetchApi(`/chef/orders/${orderId}/accept`, { method: 'PATCH' }),
  startPreparing: (orderId: string) =>
    fetchApi(`/chef/orders/${orderId}/start-preparing`, { method: 'PATCH' }),
  readyForPickup: (orderId: string) =>
    fetchApi(`/chef/orders/${orderId}/ready-for-pickup`, { method: 'PATCH' }),
};

export const AdminChefService = {
  createChef: (payload: { name: string; phone: string; password: string }) =>
    fetchApi('/admin/chefs', { method: 'POST', body: JSON.stringify(payload) }),
  getAllChefs: () => fetchApi('/admin/chefs'),
  getChefOrders: (chefId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const q = params.toString();
    return fetchApi(`/admin/chefs/${chefId}/orders${q ? `?${q}` : ''}`);
  },
  updateChefStatus: (chefId: string, isActive: boolean) =>
    fetchApi(`/admin/chefs/${chefId}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
};





