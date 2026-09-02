'use client';

import React from 'react';
import { Sun, Coffee, Utensils, Moon, Clock, Lock } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';

interface SlotPillsProps {
  slotStatuses?: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string }>;
  isDateActive?: boolean;
}

export const SlotPills: React.FC<SlotPillsProps> = ({ slotStatuses, isDateActive = true }) => {
  const { selectedSlot, setSelectedSlot } = useCartStore();

  const getIcon = (iconName: string) => {
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
    <div className="w-full bg-white border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            2. Pick Meal Slot Category
            <span className="text-xs text-slate-500 font-semibold ml-2">(உணவு வேளையைத் தேர்ந்தெடுக்கவும்)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an active time slot to view fresh dishes prepared specifically for that kitchen session.
          </p>
        </div>

        {!isDateActive && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-4 h-4 text-rose-600" />
            All Slots Closed on this Date
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MEAL_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          const status = slotStatuses?.[slot.id];
          const isSlotActive = isDateActive && status ? Boolean(status.isActive && (status.isAvailable ?? true)) : false;

          return (
            <button
              key={slot.id}
              disabled={!isSlotActive}
              onClick={() => {
                if (isSlotActive) setSelectedSlot(slot.id);
              }}
              className={`relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-300 ${
                !isSlotActive
                  ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                  : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-100/50 hover:border-emerald-400 text-slate-800'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {getIcon(slot.iconName)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight leading-tight">{slot.name}</h3>
                    <p className={`text-xs font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      {slot.nameTamil}
                    </p>
                  </div>
                </div>

                {!isSlotActive && (
                  <span className="flex items-center text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 font-extrabold shrink-0">
                    <Lock className="w-3 h-3 mr-1" /> Closed
                  </span>
                )}
              </div>

              <div className={`mt-3 pt-2.5 border-t text-xs font-semibold flex items-center justify-between ${
                isSelected ? 'border-white/20 text-white' : 'border-emerald-200/80 text-slate-500'
              }`}>
                <span className="truncate pr-1">{slot.timeRange}</span>
                {status && isSlotActive && (
                  <span className="text-[10px] opacity-90 shrink-0">Cutoff: {status.cutoffTime}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
