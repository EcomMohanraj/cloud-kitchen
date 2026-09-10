'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Lock, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export interface ScheduleDate {
  date: string;
  isDateActive: boolean;
  slots: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string; orderCutoffTime?: string }>;
}

interface DatePickerProps {
  scheduleData: ScheduleDate[];
  loading?: boolean;
}

// Fallback generator ensuring 7 selectable operating dates are ALWAYS displayed
function getEffectiveScheduleData(data: ScheduleDate[]): ScheduleDate[] {
  if (data && data.length > 0) return data;

  const today = new Date();
  const fallbackList: ScheduleDate[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    fallbackList.push({
      date: dateStr,
      isDateActive: true,
      slots: {
        BREAKFAST: { isActive: true, isAvailable: true, maxCapacity: 40, cutoffTime: '06:30 AM' },
        SNACKS: { isActive: true, isAvailable: true, maxCapacity: 40, cutoffTime: '10:00 AM' },
        LUNCH: { isActive: true, isAvailable: true, maxCapacity: 40, cutoffTime: '11:00 AM' },
        DINNER: { isActive: true, isAvailable: true, maxCapacity: 40, cutoffTime: '05:30 PM' },
      },
    });
  }
  return fallbackList;
}

export const DatePicker: React.FC<DatePickerProps> = ({ scheduleData, loading }) => {
  const { selectedDate, setSelectedDate } = useCartStore();

  const effectiveData = getEffectiveScheduleData(scheduleData);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-3.5 sm:p-5 shadow-card-soft">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[11px]">
              1
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
              Select Delivery Date
              <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                தேதியைத் தேர்ந்தெடுக்கவும்
              </span>
            </h2>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-extrabold self-start sm:self-auto bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kitchen Active
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            Chef Off
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Date Strip */}
      <div className="relative">
        <div className="flex space-x-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-24 sm:w-28 h-26 rounded-2xl bg-slate-100 animate-pulse shrink-0"
              ></div>
            ))
          ) : (
            effectiveData.map((item) => {
              const dateObj = new Date(item.date);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const dayNum = String(dateObj.getDate()).padStart(2, '0');
              const isSelected = selectedDate === item.date;
              const isActive = Boolean(item.isDateActive);

              return (
                <motion.button
                  key={item.date}
                  disabled={!isActive}
                  whileHover={isActive ? { scale: 1.03, y: -1 } : {}}
                  whileTap={isActive ? { scale: 0.97 } : {}}
                  onClick={() => {
                    if (isActive) {
                      setSelectedDate(item.date);
                    }
                  }}
                  className={`relative shrink-0 w-[94px] sm:w-28 h-26 rounded-2xl border p-2.5 flex flex-col justify-between transition-all duration-200 text-center select-none cursor-pointer ${
                    !isActive
                      ? 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-500 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/50'
                      : 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-card-hover text-slate-800'
                  }`}
                >
                  {/* Top Day Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] font-black tracking-wider">
                    <span className={isSelected ? 'text-emerald-100' : 'text-slate-500'}>
                      {dayName}
                    </span>
                    {isActive ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white shadow-xs' : 'bg-emerald-500'}`}></span>
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                  </div>

                  {/* Date & Month Number */}
                  <div className="my-auto">
                    <div className={`text-2xl font-black tracking-tight leading-none ${
                      !isActive
                        ? 'line-through text-slate-400'
                        : isSelected
                        ? 'text-white drop-shadow-xs'
                        : 'text-slate-900'
                    }`}>
                      {dayNum}
                    </div>
                    <div className={`text-[10px] font-extrabold tracking-widest mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-emerald-700'
                    }`}>
                      {monthName}
                    </div>
                  </div>

                  {/* Bottom Status Pill */}
                  <div className="w-full">
                    {isActive ? (
                      <span
                        className={`block text-[9px] font-black py-0.5 px-1.5 rounded-full uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white text-emerald-800 shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        }`}
                      >
                        Available
                      </span>
                    ) : (
                      <span className="block text-[9px] font-bold py-0.5 px-1.5 rounded-full bg-slate-100 text-slate-400 uppercase tracking-wider line-through">
                        Closed
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        {/* Scroll Hint Fade for Mobile */}
        <div className="sm:hidden absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
