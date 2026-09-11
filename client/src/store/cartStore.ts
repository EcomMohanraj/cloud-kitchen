import { create } from 'zustand';
import { getFirstValidUpcomingSlot } from '@/utils/slotTiming';

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
  isServiceAreaModalOpen: boolean;
  isSignInPromptOpen: boolean;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;

  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsServiceAreaModalOpen: (open: boolean) => void;
  setIsSignInPromptOpen: (open: boolean) => void;
  isCustomerSignedIn: () => boolean;
  setCustomerProfile: (name: string, phone: string, address?: string) => void;
  loadSavedProfile: () => void;
  logoutCustomer: () => void;
  addToCart: (item: any) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartCount: () => number;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useCartStore = create<CartStore>((set, get) => ({
  selectedDate: getLocalDateString(),
  selectedSlot: getFirstValidUpcomingSlot(getLocalDateString()) || 'BREAKFAST',
  cartItems: [],
  isCartOpen: false,
  isServiceAreaModalOpen: false,
  isSignInPromptOpen: false,
  customerName: '',
  customerPhone: '',
  deliveryAddress: '',

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setSelectedSlot: (slot: string) => set({ selectedSlot: slot }),
  setIsCartOpen: (open: boolean) => set({ isCartOpen: open }),
  setIsServiceAreaModalOpen: (open: boolean) => set({ isServiceAreaModalOpen: open }),
  setIsSignInPromptOpen: (open: boolean) => set({ isSignInPromptOpen: open }),

  isCustomerSignedIn: () => {
    const { customerName, customerPhone } = get();
    if (customerName && customerName.trim().length > 0) return true;
    if (customerPhone && customerPhone.trim().length > 0) return true;
    if (typeof window !== 'undefined') {
      try {
        const name = localStorage.getItem('yazhisai_user_name');
        const phone = localStorage.getItem('yazhisai_user_phone');
        if ((name && name.trim().length > 0) || (phone && phone.trim().length > 0)) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  },

  loadSavedProfile: () => {
    if (typeof window !== 'undefined') {
      try {
        const name = localStorage.getItem('yazhisai_user_name') || '';
        const phone = localStorage.getItem('yazhisai_user_phone') || '';
        const address = localStorage.getItem('yazhisai_user_address') || '';
        set({ customerName: name, customerPhone: phone, deliveryAddress: address });
      } catch (e) {
        console.error(e);
      }
    }
  },

  setCustomerProfile: (name: string, phone: string, address?: string) => {
    if (typeof window !== 'undefined') {
      try {
        if (name !== undefined) {
          if (name) localStorage.setItem('yazhisai_user_name', name);
          else localStorage.removeItem('yazhisai_user_name');
        }
        if (phone !== undefined) {
          if (phone) localStorage.setItem('yazhisai_user_phone', phone);
          else localStorage.removeItem('yazhisai_user_phone');
        }
        if (address !== undefined) {
          if (address) localStorage.setItem('yazhisai_user_address', address);
          else localStorage.removeItem('yazhisai_user_address');
        }
      } catch (e) {
        console.error(e);
      }
    }
    set({
      customerName: name !== undefined ? name : get().customerName,
      customerPhone: phone !== undefined ? phone : get().customerPhone,
      deliveryAddress: address !== undefined ? address : get().deliveryAddress,
    });
  },

  logoutCustomer: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('yazhisai_user_name');
        localStorage.removeItem('yazhisai_user_phone');
        localStorage.removeItem('yazhisai_user_address');
        localStorage.removeItem('yazhisai_admin_active');
      } catch (e) {
        console.error(e);
      }
    }
    set({
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      cartItems: [],
    });
  },

  addToCart: (item: any) => {
    // Trigger Service Area popup the FIRST time a customer clicks Add to Cart per session
    if (typeof window !== 'undefined') {
      try {
        const hasSeen = sessionStorage.getItem('yazhisai_service_area_seen');
        if (!hasSeen) {
          sessionStorage.setItem('yazhisai_service_area_seen', 'true');
          set({ isServiceAreaModalOpen: true });
        }
      } catch (e) {
        console.error(e);
      }
    }

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
