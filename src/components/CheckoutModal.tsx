'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote, MapPin, Phone, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnlinePayment: (order: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOpenOnlinePayment,
}) => {
  const router = useRouter();
  const { cartItems, selectedDate, selectedSlot, getCartSubtotal, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredTime, setPreferredTime] = useState('Default Slot Time');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName || !customerPhone || !deliveryAddress) {
      setErrorMsg('Please fill in all mandatory customer details.');
      return;
    }

    if (customerPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName,
        customerPhone,
        deliveryAddress,
        bookingDate: selectedDate,
        slotType: selectedSlot,
        preferredTime: preferredTime || 'Standard Slot Time',
        paymentMethod,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      const createdOrder = data.order;

      if (paymentMethod === 'ONLINE') {
        setLoading(false);
        onClose();
        onOpenOnlinePayment(createdOrder);
      } else {
        // COD Order Success
        clearCart();
        setLoading(false);
        onClose();
        router.push(`/track/${createdOrder.id}`);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Delivery & Checkout
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Order for {selectedDate} ({selectedSlot})</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="p-6 space-y-5">
          
          {/* Customer Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
              1. Customer Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anandan Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Delivery Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  required
                  rows={2}
                  placeholder="Door No, Street Name, Apartment / Landmark, Pincode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Time Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Delivery Time Window
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
            >
              <option value="As early as possible in slot">As early as possible in slot</option>
              <option value="Mid-slot delivery window">Mid-slot delivery window</option>
              <option value="Towards end of slot window">Towards end of slot window</option>
            </select>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
              2. Payment Options
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-emerald-50 border-emerald-600 text-slate-900 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1 text-emerald-600" />
                <span className="text-xs font-black">Cash on Delivery</span>
                <span className="text-[10px] text-slate-500 font-semibold">Pay when order arrives</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ONLINE')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  paymentMethod === 'ONLINE'
                    ? 'bg-emerald-50 border-emerald-600 text-slate-900 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1 text-teal-600" />
                <span className="text-xs font-black">Online Payment</span>
                <span className="text-[10px] text-slate-500 font-semibold">UPI / Card / NetBanking</span>
              </button>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="block text-xs text-slate-500 font-semibold">Total Payable</span>
              <span className="text-xl font-black text-emerald-700">₹{grandTotal}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : paymentMethod === 'ONLINE'
                ? 'Proceed to Gateway'
                : 'Confirm COD Order'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
