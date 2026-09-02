import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  nameTamil?: string;
  price: number;
  imageUrl?: string;
  slotCategory: string;
  quantity: number;
}

interface CartStore {
  selectedDate: string; // YYYY-MM-DD
  selectedSlot: string; // 'BREAKFAST' | 'SNACKS' | 'LUNCH' | 'DINNER'
  cartItems: CartItem[];
  isCartOpen: boolean;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  
  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setCustomerProfile: (name: string, phone: string, address?: string) => void;
  addToCart: (item: any) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartCount: () => number;
}

function getInitialProfile() {
  if (typeof window === 'undefined') return { name: '', phone: '', address: '' };
  try {
    const name = localStorage.getItem('yazhisai_user_name') || '';
    const phone = localStorage.getItem('yazhisai_user_phone') || '';
    const address = localStorage.getItem('yazhisai_user_address') || '';
    return { name, phone, address };
  } catch {
    return { name: '', phone: '', address: '' };
  }
}

const savedProfile = getInitialProfile();

export const useCartStore = create<CartStore>((set, get) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  selectedSlot: 'BREAKFAST',
  cartItems: [],
  isCartOpen: false,
  customerName: savedProfile.name,
  customerPhone: savedProfile.phone,
  deliveryAddress: savedProfile.address,

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setSelectedSlot: (slot: string) => set({ selectedSlot: slot }),
  setIsCartOpen: (open: boolean) => set({ isCartOpen: open }),

  setCustomerProfile: (name: string, phone: string, address?: string) => {
    if (typeof window !== 'undefined') {
      try {
        if (name) localStorage.setItem('yazhisai_user_name', name);
        if (phone) localStorage.setItem('yazhisai_user_phone', phone);
        if (address) localStorage.setItem('yazhisai_user_address', address);
      } catch (e) {
        console.error(e);
      }
    }
    set({
      customerName: name || get().customerName,
      customerPhone: phone || get().customerPhone,
      deliveryAddress: address || get().deliveryAddress,
    });
  },

  addToCart: (item: any) => {
    const { cartItems } = get();
    const itemId = String(item.id);
    const existing = cartItems.find((ci) => ci.menuItemId === itemId);
    if (existing) {
      set({
        cartItems: cartItems.map((ci) =>
          ci.menuItemId === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci
        ),
      });
    } else {
      set({
        cartItems: [
          ...cartItems,
          {
            menuItemId: itemId,
            name: item.name,
            nameTamil: item.nameTamil,
            price: item.price,
            imageUrl: item.imageUrl,
            slotCategory: item.slotCategory,
            quantity: 1,
          },
        ],
      });
    }
  },

  removeFromCart: (menuItemId: string) => {
    set({
      cartItems: get().cartItems.filter((ci) => ci.menuItemId !== menuItemId),
    });
  },

  updateQuantity: (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }
    set({
      cartItems: get().cartItems.map((ci) =>
        ci.menuItemId === menuItemId ? { ...ci, quantity } : ci
      ),
    });
  },

  clearCart: () => set({ cartItems: [] }),

  getCartSubtotal: () => {
    return get().cartItems.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  },

  getCartCount: () => {
    return get().cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  },
}));
