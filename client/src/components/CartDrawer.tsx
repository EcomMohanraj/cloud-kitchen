'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, Calendar, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Banknote, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { SettingsService } from '@/services/api';

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
    isCustomerSignedIn,
    setIsSignInPromptOpen,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [configuredDeliveryFee, setConfiguredDeliveryFee] = useState<number>(40);

  useEffect(() => {
    if (isCartOpen) {
      SettingsService.getDeliveryFee()
        .then((res) => {
          if (res && res.defaultDeliveryFee !== undefined) {
            setConfiguredDeliveryFee(res.defaultDeliveryFee);
          }
        })
        .catch(() => {});
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : configuredDeliveryFee;
  const packagingFee = subtotal > 0 ? 15 : 0;
  const grandTotal = subtotal + deliveryFee + packagingFee;

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formattedDate = formatDateString(selectedDate);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Framer Motion Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-md bg-white border-l border-emerald-100 text-slate-900 shadow-2xl flex flex-col justify-between"
        >
          
          {/* Header */}
          <div className="p-6 border-b border-emerald-100/80 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Your Kitchen Tray</h2>
                <p className="text-xs text-emerald-700 font-bold">Yazhisai Gourmet Pre-Order</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Schedule Confirmation Banner */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-mint-600 text-white flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center space-x-2 font-bold">
              <Calendar className="w-4 h-4 shrink-0 text-emerald-200" />
              <span>Target Delivery:</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-black text-white border border-white/30">
              {formattedDate} • <span className="capitalize">{selectedSlot.toLowerCase()}</span>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-emerald-500 stroke-[1.5]" />
                </div>
                <p className="text-base font-extrabold text-slate-800">Your tray is completely empty</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                  Browse the menu and select your favorite dishes for the chosen meal slot to proceed.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-emerald-100/80 shadow-sm space-x-3 hover:border-emerald-300 transition-all"
                >
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate leading-snug">{item.name}</h4>
                    {item.nameTamil && (
                      <p className="text-[11px] text-emerald-700 font-bold truncate">{item.nameTamil}</p>
                    )}
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      ₹{item.price} x {item.quantity} = <span className="text-emerald-700 font-black">₹{item.price * item.quantity}</span>
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl p-1 shadow-xs shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                    >
                      <Minus className="w-3 h-3 stroke-[3]" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Payment Switcher & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-emerald-100 bg-white space-y-4 shadow-2xl">
              
              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'ONLINE'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      {paymentMethod === 'ONLINE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-xs font-extrabold block">UPI / Online</span>
                    <span className="text-[10px] text-slate-500 font-medium">GPay, PhonePe, Razorpay</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'COD'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      {paymentMethod === 'COD' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-xs font-extrabold block">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-500 font-medium">Pay upon delivery</span>
                  </button>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Standard Packaging Charge</span>
                  <span className="font-bold text-slate-900">₹{packagingFee}</span>
                </div>

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Delivery Charge</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        FREE (Order &gt; ₹500)
                      </span>
                    ) : (
                      <span className="text-slate-900 font-bold">₹{deliveryFee}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-2.5 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700 text-lg">₹{grandTotal}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-1">
                <button
                  onClick={() => clearCart()}
                  className="px-3.5 py-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (!isCustomerSignedIn()) {
                      setIsSignInPromptOpen(true);
                    } else {
                      onProceedToCheckout();
                    }
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-mint-500 hover:from-emerald-700 hover:to-mint-600 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
};
