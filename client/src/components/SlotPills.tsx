'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Coffee, Utensils, Moon, Clock, Lock, Sparkles, Flame } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { isSlotBookingClosed } from '@/utils/slotTiming';

interface SlotPillsProps {
  slotStatuses?: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string; orderCutoffTime?: string }>;
  isDateActive?: boolean;
  timeTick?: number;
}

export const SlotPills: React.FC<SlotPillsProps> = ({ slotStatuses, isDateActive = true, timeTick }) => {
  const { selectedDate, selectedSlot, setSelectedSlot } = useCartStore();

  const getSlotIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      case 'Moon':
        return <Moon className="w-5 h-5" />;
      default:
        return <Utensils className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-5 sm:p-7 shadow-card-soft">
      {/* Title Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              Pick Meal Slot Category
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                உணவு வேளையைத் தேர்ந்தெடுக்கவும்
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Select a slot category window to reveal gourmet dishes crafted specifically for that kitchen session.
          </p>
        </div>

        {!isDateActive && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-4 h-4 text-rose-600" />
            Kitchen Closed on Selected Date
          </div>
        )}
      </div>

      {/* Segmented Capsule Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MEAL_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          const status = slotStatuses?.[slot.id];
          const orderCutoffDisplay = status?.orderCutoffTime || slot.orderCutoff || '06:00 AM';
          const isExpired = isSlotBookingClosed(orderCutoffDisplay, selectedDate);
          const isSlotActive = isDateActive && !isExpired && (status ? Boolean(status.isActive && (status.isAvailable ?? true)) : true);

          return (
            <button
              key={slot.id}
              disabled={!isSlotActive}
              onClick={() => {
                if (isSlotActive) setSelectedSlot(slot.id);
              }}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                !isSlotActive
                  ? 'opacity-60 bg-slate-100/90 border-slate-200 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800'
              }`}
            >
              {/* Framer Motion Background Slide for Active Pill */}
              {isSelected && isSlotActive && (
                <motion.div
                  layoutId="activeSlotPillBg"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-mint-600 rounded-2xl z-0"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 w-full space-y-3">
                {/* Top Row: Icon & Status Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected && isSlotActive
                        ? 'bg-white/20 text-white backdrop-blur-xs'
                        : isExpired
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {getSlotIcon(slot.iconName)}
                  </div>

                  {/* Real-time Status Pill */}
                  {isExpired ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1 border border-rose-200">
                      <Lock className="w-3 h-3 text-rose-600" /> Bookings Closed for Today
                    </span>
                  ) : isSlotActive ? (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isSelected
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-600 animate-ping' : 'bg-emerald-500'}`}></span>
                      {isSelected ? 'Live' : 'Pre-Order Open'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" /> Closed
                    </span>
                  )}
                </div>

                {/* Title & Tamil Subtitle */}
                <div>
                  <h3 className={`font-black text-base tracking-tight leading-snug ${
                    isSelected && isSlotActive ? 'text-white' : 'text-slate-900'
                  }`}>
                    {slot.name}
                  </h3>
                  <p className={`text-xs font-bold ${
                    isSelected && isSlotActive ? 'text-emerald-100' : isExpired ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    {slot.nameTamil}
                  </p>
                </div>

                {/* Footer Time & Cutoff */}
                <div className={`pt-2.5 border-t text-[11px] font-semibold flex flex-col space-y-1 ${
                  isSelected && isSlotActive ? 'border-white/20 text-emerald-50' : 'border-emerald-100 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.timeRange}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-90">
                    <span className={isSelected && isSlotActive ? 'text-amber-200' : isExpired ? 'text-rose-600 font-extrabold' : 'text-amber-700'}>
                      {isExpired ? `Cutoff Passed (${orderCutoffDisplay})` : `Book before ${orderCutoffDisplay}`}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

