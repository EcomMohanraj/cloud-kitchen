'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Coffee, Utensils, Moon, Clock, Lock, Sparkles, Flame, Carrot } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { isSlotBookingClosed, isCurrentTimeInDeliveryWindow } from '@/utils/slotTiming';

interface SlotPillsProps {
  slotStatuses?: Record<string, { isActive: boolean; isAvailable?: boolean; cutoffTime: string; orderCutoffTime?: string }>;
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
      case 'Carrot':
        return <Carrot className="w-5 h-5" />;
      default:
        return <Utensils className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-3.5 sm:p-5 shadow-card-soft">
      {/* Title Header */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[11px]">
              2
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
              Pick Meal Slot Category
              <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                உணவு வேளையைத் தேர்ந்தெடுக்கவும்
              </span>
            </h2>
          </div>
        </div>

        {!isDateActive && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            Kitchen Closed on Date
          </div>
        )}
      </div>

      {/* 2-Col Mobile / 3-Col Tablet / 5-Col Desktop Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {MEAL_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          const status = slotStatuses?.[slot.id];
          const orderCutoffDisplay = status?.orderCutoffTime || slot.orderCutoff || '06:00 AM';
          const isExpired = isSlotBookingClosed(orderCutoffDisplay, selectedDate, slot.id);
          const isSlotActive = isDateActive && !isExpired && (status ? Boolean(status.isActive && (status.isAvailable ?? true)) : true);
          const isLiveWindow = isCurrentTimeInDeliveryWindow(slot.id, selectedDate);

          return (
            <button
              key={slot.id}
              disabled={!isSlotActive}
              onClick={() => {
                if (isSlotActive) setSelectedSlot(slot.id);
              }}
              className={`relative flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 overflow-hidden ${
                !isSlotActive
                  ? 'opacity-60 bg-slate-100/90 border-slate-200 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'border-emerald-500 text-white shadow-md shadow-emerald-600/20'
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

              <div className="relative z-10 w-full space-y-2">
                {/* Top Row: Icon & Status Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
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
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-0.5 border border-rose-200">
                      <Lock className="w-2.5 h-2.5 text-rose-600" /> Closed
                    </span>
                  ) : isSlotActive ? (
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isSelected
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isLiveWindow && isSelected ? 'bg-emerald-600 animate-ping' : isSelected ? 'bg-emerald-600' : 'bg-emerald-500'}`}></span>
                      {isLiveWindow && isSelected ? 'LIVE' : isSelected ? 'Active' : 'Open'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> Off
                    </span>
                  )}
                </div>

                {/* Title & Tamil Subtitle */}
                <div>
                  <h3 className={`font-black text-xs sm:text-sm tracking-tight leading-tight ${
                    isSelected && isSlotActive ? 'text-white' : 'text-slate-900'
                  }`}>
                    {slot.name}
                  </h3>
                  <p className={`text-[10px] font-bold mt-0.5 ${
                    isSelected && isSlotActive ? 'text-emerald-100' : isExpired ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    {slot.nameTamil}
                  </p>
                </div>

                {/* Footer Time & Cutoff */}
                <div className={`pt-2 border-t text-[10px] font-medium space-y-0.5 ${
                  isSelected && isSlotActive ? 'border-white/20 text-emerald-50' : 'border-emerald-100 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {slot.timeRange}
                    </span>
                  </div>
                  <div className="flex items-center text-[9px] font-extrabold">
                    <span className={isSelected && isSlotActive ? 'text-amber-200' : isExpired ? 'text-rose-600 font-black' : 'text-emerald-700'}>
                      {isExpired ? `Passed (${orderCutoffDisplay})` : `Cutoff: ${orderCutoffDisplay}`}
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

