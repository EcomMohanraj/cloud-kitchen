import { useCartStore } from '@/store/cartStore';

export function useCart() {
  const store = useCartStore();
  return {
    items: store.cartItems,
    count: store.getCartCount(),
    subtotal: store.getCartSubtotal(),
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
}
