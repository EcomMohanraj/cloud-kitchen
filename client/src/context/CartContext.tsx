'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCartStore, CartItem } from '@/store/cartStore';

interface CartContextType {
  cartItems: CartItem[];
  subtotal: number;
  count: number;
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useCartStore();

  return (
    <CartContext.Provider
      value={{
        cartItems: store.cartItems,
        subtotal: store.getCartSubtotal(),
        count: store.getCartCount(),
        addToCart: store.addToCart,
        removeFromCart: store.removeFromCart,
        clearCart: store.clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartContext must be used within CartProvider');
  return context;
};
