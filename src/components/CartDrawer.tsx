'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    selectedDate,
    selectedSlot,
    updateQuantity,
    removeFromCart,
    getCartSubtotal,
    clearCart,
  } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Your Kitchen Tray</h2>
                <p className="text-xs text-slate-500 font-semibold">Yazhisai Cloud Kitchen Tray</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Schedule Confirmation Banner */}
          <div className="px-6 py-3 bg-emerald-100/60 border-b border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold">
              <Calendar className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>Scheduled Delivery:</span>
            </div>
            <div className="bg-emerald-700 text-white px-3 py-1 rounded-md font-bold">
              {formattedDate} ({selectedSlot})
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <ShoppingBag className="w-16 h-16 text-slate-300 mb-3 stroke-[1.5]" />
                <p className="text-base font-extrabold text-slate-700">Your tray is empty</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Browse the menu and add dishes for your selected meal slot to proceed.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 space-x-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-200"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                    {item.nameTamil && (
                      <p className="text-[11px] text-emerald-700 font-bold truncate">{item.nameTamil}</p>
                    )}
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      ₹{item.price} x {item.quantity} = <span className="text-emerald-700 font-black">₹{item.price * item.quantity}</span>
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold text-slate-900 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-white space-y-4 shadow-inner">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Delivery Charge</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE (Order &gt; ₹500)</span>
                    ) : (
                      <span className="text-slate-900 font-bold">₹{deliveryFee}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">₹{grandTotal}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => clearCart()}
                  className="px-3 py-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
