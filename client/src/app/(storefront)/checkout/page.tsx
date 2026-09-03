'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/store/cartStore';
import { ArrowLeft, ShoppingBag, MapPin, Phone, User, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartSubtotal, customerName, customerPhone, deliveryAddress, setCustomerProfile, clearCart } = useCartStore();

  const [name, setName] = useState(customerName || '');
  const [phone, setPhone] = useState(customerPhone || '');
  const [address, setAddress] = useState(deliveryAddress || '');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) return;

    setCustomerProfile(name, phone, address);
    clearCart();
    router.push('/orders');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Link href="/storefront" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
            Confirm Meal Reservation & Checkout
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Your Cart is Empty</h3>
            <Link
              href="/storefront"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#059669] text-white font-extrabold text-xs shadow-md"
            >
              Browse Today&apos;s Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                Delivery Details
              </h2>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anandan Kumar"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Delivery Address *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Door No, Street Name, Area, Landmark"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                      paymentMethod === 'COD' ? 'border-[#059669] bg-emerald-50 text-[#059669]' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    💵 Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                      paymentMethod === 'ONLINE' ? 'border-[#059669] bg-emerald-50 text-[#059669]' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    💳 Online UPI / Card
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md transition-all mt-4"
              >
                Place Order (₹{total})
              </button>
            </form>

            {/* Order Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4 self-start">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                Order Summary ({cartItems.length} items)
              </h2>

              <ul className="space-y-3 divide-y divide-slate-200">
                {cartItems.map((item) => (
                  <li key={item.menuItemId} className="pt-3 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <p className="font-extrabold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity} x ₹{item.price}</p>
                    </div>
                    <span className="font-black text-slate-900">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#059669] pt-2 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
