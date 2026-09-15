'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Clock, Star, Flame, Sparkles, UserCheck, Lock, MessageSquare, X, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { ReviewService } from '@/services/api';
import { SlotConflictModal } from '@/components/SlotConflictModal';

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
  isSlotExpired?: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, disabled = false, isSlotExpired = false }) => {
  const { cartItems, addToCart, clearAndAddToCart, updateQuantity } = useCartStore();

  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(item.rating || 4.9);
  const [reviewCount, setReviewCount] = useState<number>(item.ratingCount || 0);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [slotConflictData, setSlotConflictData] = useState<{
    isOpen: boolean;
    currentSlot?: string;
    newSlot?: string;
  } | null>(null);

  const handleAddToCart = () => {
    const res = addToCart(item);
    if (res && res.hasConflict) {
      setSlotConflictData({
        isOpen: true,
        currentSlot: res.currentSlot,
        newSlot: res.newSlot,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (item.id) {
      ReviewService.getMenuItemReviews(item.id)
        .then((res) => {
          if (isMounted && res.success) {
            setReviewsList(res.reviews || []);
            if (res.totalCount > 0) {
              setAvgRating(res.averageRating);
              setReviewCount(res.totalCount);
            }
          }
        })
        .catch((err) => console.warn('Could not load reviews for item:', item.id, err));
    }
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const cartItem = cartItems.find((ci) => ci.menuItemId === String(item.id));
  const quantity = cartItem ? cartItem.quantity : 0;

  // Defaults if missing in mock DB
  const isVeg = item.isVeg !== undefined ? item.isVeg : !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('kari') && !item.name.toLowerCase().includes('mutton') && !item.name.toLowerCase().includes('fish');
  const servingSize = item.servingSize || 'Serves 1-2';
  const isChefSpecial = item.isChefSpecial !== undefined ? item.isChefSpecial : item.price > 120;

  const isCardActive = item.isAvailable && !disabled && !isSlotExpired;

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
          <button
            onClick={() => setIsReviewsOpen(true)}
            className="flex items-center gap-1 bg-black/50 hover:bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/25 text-xs font-bold transition-all cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{avgRating}</span>
            <span className="text-[10px] text-slate-300 font-normal">({reviewCount})</span>
          </button>
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
            <div className="w-full py-2.5 text-center text-xs font-extrabold rounded-xl border flex items-center justify-center gap-1.5 bg-rose-50 border-rose-200 text-rose-700">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>
                {isSlotExpired
                  ? 'Slot Booking Closed for Today'
                  : !item.isAvailable
                  ? 'Sold Out / Unavailable Today'
                  : 'Kitchen Closed on Date'}
              </span>
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
                    onClick={handleAddToCart}
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
                      onClick={() => {
                        const conflict = useCartStore.getState().checkSlotConflict(item);
                        if (conflict.hasConflict) {
                          setSlotConflictData({
                            isOpen: true,
                            currentSlot: conflict.currentSlot,
                            newSlot: conflict.newSlot,
                          });
                        } else {
                          updateQuantity(String(item.id), quantity + 1);
                        }
                      }}
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

      {/* Expandable Dish Reviews Modal */}
      {isReviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative space-y-4 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 mt-0.5">
                    <span className="text-amber-600 font-black">★ {avgRating}</span>
                    <span>•</span>
                    <span>{reviewCount} verified {reviewCount === 1 ? 'review' : 'reviews'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsReviewsOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reviews List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {reviewsList.length > 0 ? (
                reviewsList.map((rev: any) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                          {rev.reviewerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight">{rev.reviewerName}</span>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Patron
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-0.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-700 font-black text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-slate-700 font-medium italic leading-relaxed pt-1">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}

                    <span className="text-[10px] text-slate-400 block text-right font-semibold">
                      {new Date(rev.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2 text-slate-500 text-xs">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-extrabold text-slate-800">No Public Reviews Yet</p>
                  <p className="text-[11px] text-slate-500">Be the first verified customer to order and rate this dish!</p>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsReviewsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Close Reviews
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slot Conflict Modal */}
      {slotConflictData && (
        <SlotConflictModal
          isOpen={slotConflictData.isOpen}
          onClose={() => setSlotConflictData(null)}
          onClearAndSwitch={() => clearAndAddToCart(item)}
          currentSlot={slotConflictData.currentSlot}
          newSlot={slotConflictData.newSlot}
          pendingItemName={item.name}
        />
      )}

    </div>
  );
};
