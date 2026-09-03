'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Coffee, Utensils, Moon, Lock } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { isSlotExpiredToday } from '@/utils/slotTiming';

interface MealSlotTabsProps {
  slotStatuses?: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string }>;
  isDateActive?: boolean;
}

export const MealSlotTabs: React.FC<MealSlotTabsProps> = ({ slotStatuses, isDateActive = true }) => {
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
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#059669] flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              Select Operating Meal Slot
              <span className="text-xs text-[#059669] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                உணவு நேரத்தைத் தேர்ந்தெடுக்கவும்
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Pick a specific meal session window to view available pre-order dishes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MEAL_SLOTS.map((slot) => {
          const statusObj = slotStatuses ? slotStatuses[slot.id] : undefined;
          const isSlotConfiguredActive = statusObj ? Boolean(statusObj.isActive && (statusObj.isAvailable ?? true)) : true;
          const isExpired = isSlotExpiredToday(selectedDate, slot.id);
          const isSlotEnabled = isDateActive && isSlotConfiguredActive && !isExpired;
          const isSelected = selectedSlot === slot.id;

          return (
            <motion.button
              key={slot.id}
              disabled={!isSlotEnabled}
              whileHover={isSlotEnabled ? { scale: 1.02 } : {}}
              whileTap={isSlotEnabled ? { scale: 0.98 } : {}}
              onClick={() => {
                if (isSlotEnabled) {
                  setSelectedSlot(slot.id);
                }
              }}
              className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 ${
                !isSlotEnabled
                  ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'bg-gradient-to-br from-[#059669] to-[#047857] border-emerald-600 text-white shadow-lg shadow-emerald-700/25 ring-2 ring-emerald-400/50'
                  : 'bg-white border-emerald-100 hover:border-emerald-300 text-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#059669]'}`}>
                  {getSlotIcon(slot.iconName)}
                </div>
                {!isSlotEnabled && <Lock className="w-4 h-4 text-slate-400" />}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm tracking-tight">{slot.name}</h3>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-100' : 'text-[#059669]'}`}>
                    {slot.nameTamil}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 font-semibold ${isSelected ? 'text-emerald-100/90' : 'text-slate-500'}`}>
                  {slot.timeRange}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
