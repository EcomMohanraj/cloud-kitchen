import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const StickyCartBar: React.FC = () => {
  const { getCartCount, getCartSubtotal, setIsCartOpen } = useCartStore();
  const count = getCartCount();
  const subtotal = getCartSubtotal();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full bg-[#059669] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-extrabold text-sm"
      >
        <div className="flex items-center space-x-3">
          <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center">
            {count}
          </span>
          <span>View Tray Items</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-base font-black">₹{subtotal}</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
};
