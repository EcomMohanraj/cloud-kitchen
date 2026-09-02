'use client';

import React from 'react';
import { Plus, Minus, Clock, Flame } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export interface MenuItemProps {
  id: string;
  name: string;
  nameTamil?: string;
  description?: string;
  price: number;
  slotCategory: string;
  isAvailable: boolean;
  imageUrl?: string;
  ingredients?: string;
  prepTimeMinutes: number;
}

interface MenuCardProps {
  item: MenuItemProps;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { cartItems, addToCart, updateQuantity } = useCartStore();

  const cartItem = cartItems.find((ci) => ci.menuItemId === (item.id as any));
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="group relative flex flex-col justify-between bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-600/10 transition-all duration-300">
      
      {/* Image Container */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Soft Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>

        {/* Slot Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-emerald-200 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
          {item.slotCategory}
        </div>

        {/* Prep Time Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-emerald-600" />
          {item.prepTimeMinutes} mins
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 flex items-baseline gap-1">
          <span className="text-2xl font-black text-white drop-shadow-md">
            ₹{item.price}
          </span>
          <span className="text-xs text-slate-200 font-medium drop-shadow">/ portion</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
              {item.name}
            </h3>
          </div>
          {item.nameTamil && (
            <p className="text-xs text-emerald-700 font-bold mt-0.5">
              {item.nameTamil}
            </p>
          )}

          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed font-normal">
            {item.description}
          </p>
        </div>

        {/* Ingredients Pill */}
        {item.ingredients && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <Flame className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-700 shrink-0">Key Ingredients:</span>{' '}
              <span className="truncate">{item.ingredients}</span>
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-3">
          {!item.isAvailable ? (
            <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl border border-slate-200">
              Sold Out / Unavailable
            </div>
          ) : quantity === 0 ? (
            <button
              onClick={() => addToCart(item)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Tray</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(item.id as any, quantity - 1)}
                className="w-8 h-8 rounded-lg bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center font-bold transition-colors shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1 font-extrabold text-slate-900 text-sm">
                <span>{quantity}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">in tray</span>
              </div>

              <button
                onClick={() => updateQuantity(item.id as any, quantity + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
