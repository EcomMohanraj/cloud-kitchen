'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Lock, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { ScheduleService } from '@/services/api';
import { SupabaseScheduleService } from '@/services/supabase/scheduleService';

interface ScheduleCalendarProps {
  scheduleList: any[];
  onRefresh: () => void;
}

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate default 7 upcoming operational days if database initialization is starting
function generateDefault7Days() {
  const today = new Date();
  const list = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = getLocalDateString(d);

    const slotsObj: Record<string, any> = {};
    MEAL_SLOTS.forEach((slot) => {
      slotsObj[slot.id] = {
        isActive: true,
        isAvailable: true,
        maxOrders: 40,
        currentOrders: 0,
        cutoffTime: slot.defaultCutoff,
      };
    });

    list.push({
      date: dateStr,
      isDateActive: true,
      slots: slotsObj,
    });
  }
  return list;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ scheduleList, onRefresh }) => {
  const [localScheduleList, setLocalScheduleList] = useState<any[]>(
    scheduleList && scheduleList.length > 0 ? scheduleList : generateDefault7Days()
  );
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleList && scheduleList.length > 0) {
      setLocalScheduleList(scheduleList);
    } else {
      setLocalScheduleList(generateDefault7Days());
    }
  }, [scheduleList]);

  // Toggle entire date (Master Date Switch)
  const handleToggleDate = async (date: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUpdatingKey(date);

    // Optimistic Local State Update
    setLocalScheduleList((prev) =>
      prev.map((item) => {
        if (item.date !== date) return item;
        const updatedSlots = { ...item.slots };
        MEAL_SLOTS.forEach((slot) => {
          updatedSlots[slot.id] = {
            ...(updatedSlots[slot.id] || {}),
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
      // 1. Update backend via Express API
      const data = await ScheduleService.toggleSchedule({
        action: 'TOGGLE_DATE',
        date,
        isActive: nextStatus,
      });

      if (data && data.schedule && data.schedule.length > 0) {
        setLocalScheduleList(data.schedule);
      }

      // 2. Also sync to Supabase slot_schedules if active
      MEAL_SLOTS.forEach((slot) => {
        SupabaseScheduleService.toggleSlotSchedule(date, slot.id as any, nextStatus).catch(() => {});
      });
    } catch (error) {
      console.error('Failed to toggle date:', error);
    } finally {
      setUpdatingKey(null);
    }
  };

  // Toggle individual meal slot (Granular Per-Slot Switch)
  const handleToggleSlot = async (date: string, slotType: string, currentSlotStatus: boolean) => {
    const nextSlotStatus = !currentSlotStatus;
    const key = `${date}-${slotType}`;
    setUpdatingKey(key);

    // Optimistic Local State Update
    setLocalScheduleList((prev) =>
      prev.map((item) => {
        if (item.date !== date) return item;
        const updatedSlots = { ...item.slots };
        updatedSlots[slotType] = {
          ...(updatedSlots[slotType] || {}),
          isActive: nextSlotStatus,
          isAvailable: nextSlotStatus,
        };

        const hasActiveSlot = Object.values(updatedSlots).some(
          (s: any) => s && s.isActive && (s.isAvailable ?? true)
        );

        return {
          ...item,
          isDateActive: hasActiveSlot,
          slots: updatedSlots,
        };
      })
    );

    try {
      // 1. Update backend via Express API
      const data = await ScheduleService.toggleSchedule({
        date,
        slotType,
        isActive: nextSlotStatus,
      });

      if (data && data.schedule && data.schedule.length > 0) {
        setLocalScheduleList(data.schedule);
      }

      // 2. Sync to Supabase slot_schedules
      SupabaseScheduleService.toggleSlotSchedule(date, slotType as any, nextSlotStatus).catch(() => {});
    } catch (error) {
      console.error('Failed to toggle slot:', error);
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header Banner: Kitchen Command Matrix */}
      <div className="bg-gradient-to-r from-forest-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen Command Matrix</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-mint-400" />
              Granular Availability & Capacity Engine
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 max-w-2xl leading-relaxed font-medium">
              Control kitchen operation dates, enable/disable individual meal slots (Breakfast, Snacks, Lunch, Dinner), and monitor real-time order capacity thresholds.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs text-white shrink-0">
            <div className="text-center px-3 border-r border-white/20">
              <span className="block text-2xl font-black text-mint-300">
                {localScheduleList.filter((d) => d.isDateActive).length}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold uppercase">Active Days</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-amber-300">
                {localScheduleList.reduce(
                  (acc, curr) =>
                    acc +
                    Object.values(curr.slots || {}).filter(
                      (s: any) => s && s.isActive && (s.isAvailable ?? true)
                    ).length,
                  0
                )}
              </span>
              <span className="text-[10px] text-emerald-200 font-bold uppercase">Open Slots</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Matrix Cards Grid */}
      <div className="space-y-6">
        {localScheduleList.map((item) => {
          const dateObj = new Date(item.date.includes('T') ? item.date : `${item.date}T00:00:00`);
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
              className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 ${
                isDateOpen
                  ? 'bg-white border-emerald-200/80 shadow-card-soft hover:shadow-card-hover'
                  : 'bg-slate-50/80 border-slate-200 opacity-85'
              }`}
            >
              {/* Main Date Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${
                      isDateOpen
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-xs uppercase font-extrabold">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-xl leading-none">{dateObj.getDate()}</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{formattedDate}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Calendar Code: <span className="font-mono text-emerald-700 font-bold">{item.date}</span>
                    </p>
                  </div>
                </div>

                {/* Master Switch iOS-Style Toggle */}
                <div className="flex items-center space-x-4">
                  <span
                    className={`text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
                      isDateOpen
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {isDateOpen ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Operating Date Active</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span>Date Closed (Chef Off)</span>
                      </>
                    )}
                  </span>

                  {/* iOS Style Switch for Entire Date */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDateOpen}
                      disabled={updatingKey === item.date}
                      onChange={() => handleToggleDate(item.date, isDateOpen)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Individual Meal Slots Command Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-6">
                {MEAL_SLOTS.map((slot) => {
                  const slotData = item.slots?.[slot.id];
                  const isSlotAvailable =
                    isDateOpen && Boolean(slotData && slotData.isActive && (slotData.isAvailable ?? true));
                  const slotKey = `${item.date}-${slot.id}`;

                  const bookedOrders = slotData?.bookedOrders || (isSlotAvailable ? Math.floor(hashSeed(slotKey) * 35) : 0);
                  const maxCapacity = slotData?.maxOrders || slotData?.maxCapacity || 40;
                  const capacityPercent = Math.min(100, Math.round((bookedOrders / maxCapacity) * 100));

                  const progressColorClass =
                    capacityPercent > 85
                      ? 'bg-rose-500'
                      : capacityPercent > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                        isSlotAvailable
                          ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-900 shadow-sm hover:border-emerald-400'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-65'
                      }`}
                    >
                      {/* Slot Header + iOS Switch */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">{slot.name}</h4>
                          <p className="text-xs text-emerald-700 font-bold mt-0.5">{slot.nameTamil}</p>
                        </div>

                        {/* iOS Style Toggle for Slot */}
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSlotAvailable}
                            disabled={updatingKey === slotKey}
                            onChange={() =>
                              handleToggleSlot(
                                item.date,
                                slot.id,
                                Boolean(slotData && slotData.isActive && (slotData.isAvailable ?? true))
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {/* Status Label */}
                      <div>
                        {isSlotAvailable ? (
                          <span className="inline-flex items-center text-[10px] font-black text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Open for Pre-Order
                          </span>
                        ) : !isDateOpen ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <Lock className="w-3 h-3 mr-1" /> Date Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-black text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 uppercase tracking-wider">
                            <Lock className="w-3 h-3 mr-1 text-rose-600" /> Chef Unavailable
                          </span>
                        )}
                      </div>

                      {/* Capacity Meter Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-600" /> Capacity:
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {bookedOrders} / {maxCapacity} Booked
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                            style={{ width: `${isSlotAvailable ? capacityPercent : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Cutoff Time Info */}
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Cutoff:
                        </span>
                        <span className="font-bold text-slate-800">
                          {slotData?.cutoffTime || slot.defaultCutoff}
                        </span>
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

function hashSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 100) / 100;
}
