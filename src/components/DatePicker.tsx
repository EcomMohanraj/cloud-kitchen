'use client';

import React from 'react';
import { Calendar as CalendarIcon, Lock, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export interface ScheduleDate {
  date: string;
  isDateActive: boolean;
  slots: Record<string, { isActive: boolean; isAvailable?: boolean; maxCapacity: number; cutoffTime: string }>;
}

interface DatePickerProps {
  scheduleData: ScheduleDate[];
  loading?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ scheduleData, loading }) => {
  const { selectedDate, setSelectedDate } = useCartStore();

  return (
    <div className="w-full bg-white border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            1. Select Delivery Date
            <span className="text-xs text-slate-500 font-semibold ml-2">(தேதியைத் தேர்ந்தெடுக்கவும்)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud kitchen availability is strictly controlled by Chef Yazhisai for fresh on-demand cooking.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Kitchen Active
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            Kitchen Closed
          </div>
        </div>
      </div>

      {/* Date Carousel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
          ))
        ) : (
          scheduleData.map((item) => {
            const dateObj = new Date(item.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = dateObj.getDate();
            const isSelected = selectedDate === item.date;
            const isActive = Boolean(item.isDateActive);

            return (
              <button
                key={item.date}
                disabled={!isActive}
                onClick={() => {
                  if (isActive) {
                    setSelectedDate(item.date);
                  }
                }}
                className={`relative flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all duration-300 text-left ${
                  !isActive
                    ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400'
                    : isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02] font-bold'
                    : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100/50 text-slate-800'
                }`}
              >
                {/* Active Checkmark or Lock */}
                <div className="w-full flex justify-between items-center text-[10px] uppercase font-extrabold tracking-wider mb-1">
                  <span>{dayName}</span>
                  {isActive ? (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-white' : 'text-emerald-600'
                      }`}
                    />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>

                {/* Day Number */}
                <div className="my-1 text-center">
                  <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {dayNum}
                  </span>
                  <span className={`block text-[11px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {monthName}
                  </span>
                </div>

                {/* Status Pills */}
                <div className="w-full mt-1 pt-1.5 border-t border-black/10 text-center">
                  {isActive ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-200/80 text-emerald-900'
                    }`}>
                      Open for Orders
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">
                      Chef Day Off
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
