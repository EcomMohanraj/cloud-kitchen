'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Clock, Star, Flame, Sparkles, UserCheck } from 'lucide-react';
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
  rating?: number;
  ratingCount?: number;
  isVeg?: boolean;
  servingSize?: string;
  isChefSpecial?: boolean;
}

interface MenuCardProps {
  item: MenuItemProps;
  disabled?: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, disabled = false }) => {
  const { cartItems, addToCart, updateQuantity } = useCartStore();

  const cartItem = cartItems.find((ci) => ci.menuItemId === String(item.id));
  const quantity = cartItem ? cartItem.quantity : 0;

  // Defaults if missing in mock DB
  const isVeg = item.isVeg !== undefined ? item.isVeg : !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('kari') && !item.name.toLowerCase().includes('mutton') && !item.name.toLowerCase().includes('fish');
  const rating = item.rating || 4.9;
  const ratingCount = item.ratingCount || 128;
  const servingSize = item.servingSize || 'Serves 1-2';
  const isChefSpecial = item.isChefSpecial !== undefined ? item.isChefSpecial : item.price > 120;

  const isCardActive = item.isAvailable && !disabled;

  return (
    <div className="group relative flex flex-col justify-between bg-white border border-emerald-100/70 rounded-3xl overflow-hidden hover:border-emerald-400 hover:shadow-card-hover transition-all duration-300">
      
      {/* 16:9 Photography Header */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Soft Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Veg / Non-Veg Indicator Pill */}
          <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-white/60">
            <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 ${
              isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}></div>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              {isVeg ? 'Pure Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Chef Special Badge */}
          {isChefSpecial && (
            <div className="bg-amber-500/95 text-slate-950 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm border border-amber-300">
              <Sparkles className="w-3 h-3 text-slate-950" /> Chef&apos;s Special
            </div>
          )}
        </div>

        {/* Bottom Image Info Pill Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <div className="text-2xl font-black text-white drop-shadow-md tracking-tight">
              ₹{item.price}
            </div>
            <div className="text-[10px] text-emerald-200 font-bold drop-shadow">
              {servingSize}
            </div>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-xs font-bold">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{rating}</span>
            <span className="text-[10px] text-slate-300 font-normal">({ratingCount})</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title & Tamil Subtitle */}
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors leading-snug">
            {item.name}
          </h3>
          {item.nameTamil && (
            <p className="text-xs text-emerald-700 font-bold mt-0.5">
              {item.nameTamil}
            </p>
          )}

          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-normal">
            {item.description}
          </p>
        </div>

        {/* Meta Info (Prep Time & Ingredients) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Prep: <strong className="text-slate-800">{item.prepTimeMinutes} mins</strong>
            </span>
            <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {item.slotCategory}
            </span>
          </div>

          {item.ingredients && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-700 shrink-0">Key:</span>
              <span className="truncate">{item.ingredients}</span>
            </div>
          )}
        </div>

        {/* Animated Add / Quantity Stepper Button */}
        <div className="pt-2">
          {!isCardActive ? (
            <div className="w-full py-2.5 text-center text-xs font-extrabold text-slate-400 bg-slate-100 rounded-xl border border-slate-200">
              {!item.isAvailable ? 'Sold Out / Unavailable Today' : 'Slot Closed'}
            </div>
          ) : (
            <div className="relative w-full h-11">
              <AnimatePresence mode="wait">
                {quantity === 0 ? (
                  <motion.button
                    key="add-btn"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => addToCart(item)}
                    className="w-full h-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ADD +</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="counter-btn"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full h-full flex items-center justify-between bg-emerald-50 border-2 border-emerald-600 rounded-xl p-1 shadow-sm"
                  >
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(String(item.id), quantity - 1)}
                      className="w-9 h-9 rounded-lg bg-white text-emerald-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center font-black transition-colors shadow-sm"
                    >
                      <Minus className="w-4 h-4 stroke-[3]" />
                    </motion.button>

                    <div className="flex items-center space-x-1 font-black text-slate-900 text-sm px-2">
                      <span>{quantity}</span>
                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase">in tray</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(String(item.id), quantity + 1)}
                      className="w-9 h-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-black transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
