'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CheckoutModal } from '@/components/CheckoutModal';
import { SignInPromptModal } from '@/components/SignInPromptModal';
import { useCartStore } from '@/store/cartStore';
import { SettingsService } from '@/services/api';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartSubtotal, isCustomerSignedIn, isSignInPromptOpen, setIsSignInPromptOpen } = useCartStore();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(true);
  const [configuredDeliveryFee, setConfiguredDeliveryFee] = useState<number>(40);

  const isSignedIn = isCustomerSignedIn();

  useEffect(() => {
    SettingsService.getDeliveryFee()
      .then((res) => {
        if (res && res.defaultDeliveryFee !== undefined) {
          setConfiguredDeliveryFee(res.defaultDeliveryFee);
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal > 500 ? 0 : configuredDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const handleOpenCheckout = () => {
    if (!isSignedIn) {
      setIsSignInPromptOpen(true);
    } else {
      setIsCheckoutModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 w-fit mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure Customer Checkout • பாதுகாப்பான செலுத்தல்</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Review & Place Order
            </h1>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Your Tray is Empty</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Please add your favorite South Indian dishes from our active menu calendar before proceeding to checkout.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
            >
              <span>Explore Calendar Menu</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Ready to complete your meal order?</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Total items in tray: <span className="font-extrabold text-slate-900">{cartItems.length}</span> • Total Payable: <span className="font-black text-emerald-800">₹{grandTotal}</span>
            </p>
            <button
              onClick={handleOpenCheckout}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              Open Checkout Window
            </button>
          </div>
        )}
      </main>

      <SignInPromptModal
        isOpen={isSignInPromptOpen || (!isSignedIn && cartItems.length > 0 && isCheckoutModalOpen)}
        onClose={() => {
          setIsSignInPromptOpen(false);
          setIsCheckoutModalOpen(false);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen && cartItems.length > 0 && isSignedIn}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </div>
  );
}
