'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, UtensilsCrossed, Calendar, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const Navbar = () => {
  const { getCartCount, setIsCartOpen, selectedDate, selectedSlot } = useCartStore();
  const cartCount = getCartCount();

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 p-0.5 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-emerald-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-slate-900 tracking-tight">Yazhisai</span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Cloud Kitchen
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold tracking-wide">
                யாழிசை மனையக உணவகம்
              </p>
            </div>
          </Link>

          {/* Active Booking Badge */}
          <div className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-xs text-slate-700 shadow-sm">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Ordering for:</span>
            </div>
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">
              {formattedDate} • <span className="capitalize">{selectedSlot.toLowerCase()}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            
            {/* Admin Portal Link */}
            <Link
              href="/admin/schedule"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Chef Portal</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all duration-200 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Tray</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-800 text-xs font-extrabold flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
