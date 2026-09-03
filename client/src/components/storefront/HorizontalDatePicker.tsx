'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export interface ScheduleDate {
  date: string;
  isDateActive: boolean;
  slots: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string }>;
}

interface HorizontalDatePickerProps {
  scheduleData: ScheduleDate[];
  loading?: boolean;
}

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

export const HorizontalDatePicker: React.FC<HorizontalDatePickerProps> = ({ scheduleData, loading }) => {
  const { selectedDate, setSelectedDate } = useCartStore();
  const effectiveData = getEffectiveScheduleData(scheduleData);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-5 sm:p-7 shadow-card-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#059669] flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              Select Delivery Date
              <span className="text-xs text-[#059669] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                தேதியைத் தேர்ந்தெடுக்கவும்
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Choose an available date on Chef Yazhisai&apos;s kitchen calendar for fresh on-demand meal prep.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold self-start sm:self-auto bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-[#059669]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse"></span>
            Kitchen Active
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Chef Off
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex space-x-3.5 overflow-x-auto no-scrollbar py-2.5 px-1 scroll-smooth">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-28 sm:w-32 h-36 rounded-2xl bg-slate-100 animate-pulse shrink-0"
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
                  whileHover={isActive ? { scale: 1.04, y: -2 } : {}}
                  whileTap={isActive ? { scale: 0.96 } : {}}
                  onClick={() => {
                    if (isActive) {
                      setSelectedDate(item.date);
                    }
                  }}
                  className={`relative shrink-0 w-28 sm:w-32 h-36 rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-300 text-center select-none cursor-pointer ${
                    !isActive
                      ? 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-gradient-to-b from-[#059669] to-[#047857] border-emerald-500 text-white shadow-xl shadow-emerald-600/30 scale-[1.03] ring-2 ring-emerald-400/50'
                      : 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-card-hover text-slate-800'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-extrabold tracking-wider">
                    <span className={isSelected ? 'text-emerald-100' : 'text-slate-500'}>
                      {dayName}
                    </span>
                    {isActive ? (
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white shadow-sm' : 'bg-[#059669]'}`}></span>
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                  </div>

                  <div className="my-auto">
                    <div className={`text-3xl font-black tracking-tight leading-none ${
                      !isActive
                        ? 'line-through text-slate-400'
                        : isSelected
                        ? 'text-white drop-shadow-sm'
                        : 'text-slate-900'
                    }`}>
                      {dayNum}
                    </div>
                    <div className={`text-[11px] font-bold mt-1 tracking-widest ${
                      isSelected ? 'text-emerald-100' : 'text-[#059669]'
                    }`}>
                      {monthName}
                    </div>
                  </div>

                  <div className="w-full pt-1">
                    {isActive ? (
                      <span
                        className={`block text-[10px] font-black py-1 px-2 rounded-full uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white text-emerald-800 shadow-sm'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        }`}
                      >
                        Available
                      </span>
                    ) : (
                      <span className="block text-[10px] font-bold py-1 px-2 rounded-full bg-slate-100 text-slate-400 uppercase tracking-wider line-through">
                        Closed
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
