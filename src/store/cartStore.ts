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
  
  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: string) => void;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: any) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  selectedDate: '2026-09-02', // default seed active date
  selectedSlot: 'BREAKFAST',
  cartItems: [],
  isCartOpen: false,

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setSelectedSlot: (slot: string) => set({ selectedSlot: slot }),
  setIsCartOpen: (open: boolean) => set({ isCartOpen: open }),

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
      cartItems: get().cartItems.filter((ci) => ci.menuItemId === menuItemId),
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
