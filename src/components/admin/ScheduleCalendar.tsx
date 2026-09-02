'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ToggleLeft, ToggleRight, Clock, Users, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

interface ScheduleCalendarProps {
  scheduleList: any[];
  onRefresh: () => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ scheduleList, onRefresh }) => {
  const [localScheduleList, setLocalScheduleList] = useState<any[]>(scheduleList);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    setLocalScheduleList(scheduleList);
  }, [scheduleList]);

  // Toggle entire date
  const handleToggleDate = async (date: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUpdatingKey(date);

    // Optimistic UI Update
    setLocalScheduleList((prev) =>
      prev.map((item) => {
        if (item.date !== date) return item;
        const updatedSlots = { ...item.slots };
        Object.keys(updatedSlots).forEach((slotType) => {
          updatedSlots[slotType] = {
            ...updatedSlots[slotType],
            isActive: nextStatus,
            isAvailable: nextStatus,
          };
        });
        return {
          ...item,
          isDateActive: nextStatus,
          slots: updatedSlots,
        };
      })
    );

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'TOGGLE_DATE',
          date,
          isActive: nextStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.schedule) {
        setLocalScheduleList(data.schedule);
      }
    } catch (error) {
      console.error('Failed to toggle date:', error);
      onRefresh();
    } finally {
      setUpdatingKey(null);
    }
  };

  // Toggle individual meal slot
  const handleToggleSlot = async (date: string, slotType: string, currentSlotStatus: boolean, isDateActive: boolean) => {
    const nextSlotStatus = !currentSlotStatus;
    const key = `${date}-${slotType}`;
    setUpdatingKey(key);

    // Optimistic UI Update
    setLocalScheduleList((prev) =>
      prev.map((item) => {
        if (item.date !== date) return item;
        const updatedSlots = { ...item.slots };
        updatedSlots[slotType] = {
          ...updatedSlots[slotType],
          isActive: nextSlotStatus,
          isAvailable: nextSlotStatus,
        };

        const hasActiveSlot = Object.values(updatedSlots).some((s: any) => s.isActive && (s.isAvailable ?? true));
        return {
          ...item,
          isDateActive: hasActiveSlot,
          slots: updatedSlots,
        };
      })
    );

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          slotType,
          isActive: nextSlotStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.schedule) {
        setLocalScheduleList(data.schedule);
      }
    } catch (error) {
      console.error('Failed to toggle slot:', error);
      onRefresh();
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header Banner */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Granular Schedule Engine</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-600" />
              Yazhisai Kitchen Calendar & Granular Meal Slot Control
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Enable or disable specific meal slots (Breakfast, Snacks, Lunch, Dinner) per calendar date. When a date is closed, all slots under it automatically lock and disable on customer storefronts.
            </p>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Slot Active: Ordering Open
            </div>
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Slot Disabled: Hidden from Customers
            </div>
          </div>
        </div>
      </div>

      {/* Date Cards Grid */}
      <div className="space-y-6">
        {localScheduleList.map((item) => {
          const dateObj = new Date(item.date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const isDateOpen = Boolean(item.isDateActive);

          return (
            <div
              key={item.date}
              className={`p-6 rounded-2xl border transition-all duration-300 ${
                isDateOpen
                  ? 'bg-white border-emerald-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              {/* Date Header Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                      isDateOpen
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{formattedDate}</h3>
                    <p className="text-xs text-slate-500 font-semibold">Date Code: <span className="font-mono text-emerald-700">{item.date}</span></p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Status Badge */}
                  <span
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
                      isDateOpen
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {isDateOpen ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Date Active</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span>Closed (Chef Day Off)</span>
                      </>
                    )}
                  </span>

                  {/* Main Date Toggle Button */}
                  <button
                    disabled={updatingKey === item.date}
                    onClick={() => handleToggleDate(item.date, isDateOpen)}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm active:scale-95 ${
                      isDateOpen
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                    }`}
                  >
                    {isDateOpen ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-rose-600" />
                        <span>Close Entire Date</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-emerald-100" />
                        <span>Enable Cooking Date</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Granular Per-Slot Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                {MEAL_SLOTS.map((slot) => {
                  const slotData = item.slots?.[slot.id];
                  const isSlotAvailable = isDateOpen && Boolean(slotData?.isActive && (slotData?.isAvailable ?? true));
                  const slotKey = `${item.date}-${slot.id}`;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
                        isSlotAvailable
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-sm hover:border-emerald-500'
                          : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-slate-900">{slot.name}</h4>
                          </div>
                          <p className="text-xs text-emerald-700 font-bold mt-0.5">{slot.nameTamil}</p>
                        </div>

                        {/* Individual Slot Switch */}
                        <button
                          disabled={updatingKey === slotKey}
                          onClick={() =>
                            handleToggleSlot(item.date, slot.id, Boolean(slotData?.isActive && (slotData?.isAvailable ?? true)), isDateOpen)
                          }
                          className="p-1 rounded-lg hover:bg-black/5 transition-colors focus:outline-none"
                          title={isSlotAvailable ? 'Click to Disable this Slot' : 'Click to Enable this Slot'}
                        >
                          {isSlotAvailable ? (
                            <ToggleRight className="w-7 h-7 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Slot Status Label */}
                      <div>
                        {isSlotAvailable ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Open for Delivery
                          </span>
                        ) : !isDateOpen ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                            <Lock className="w-3 h-3 mr-1" /> Date Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <Lock className="w-3 h-3 mr-1 text-rose-600" /> Slot Turned OFF
                          </span>
                        )}
                      </div>

                      {/* Slot Controls & Metadata */}
                      <div className="text-[11px] space-y-1.5 text-slate-600 pt-3 border-t border-slate-200 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-emerald-600" /> Slot Window:
                          </span>
                          <span className="text-slate-800 font-bold text-[10px] truncate max-w-[120px]">
                            {slot.timeRange.split('&')[0]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold">
                            <Users className="w-3 h-3 text-emerald-600" /> Max Capacity:
                          </span>
                          <span className="text-slate-900 font-extrabold">{slotData?.maxOrders || slotData?.maxCapacity || 50} orders</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
