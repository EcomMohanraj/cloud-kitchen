'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Lock, CheckCircle2 } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { ScheduleService } from '@/services/api';

interface KitchenMatrixProps {
  scheduleList: any[];
  onRefresh: () => void;
}

function generateDefault7Days() {
  const today = new Date();
  const list = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

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

export const KitchenMatrix: React.FC<KitchenMatrixProps> = ({ scheduleList, onRefresh }) => {
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

  const handleToggleDate = async (date: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUpdatingKey(date);

    try {
      await ScheduleService.toggleDateStatus(date, nextStatus);
      setLocalScheduleList((prev) =>
        prev.map((item) => (item.date === date ? { ...item, isDateActive: nextStatus } : item))
      );
      onRefresh();
    } catch (err) {
      console.error('Error toggling date:', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleToggleSlot = async (date: string, slotId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const key = `${date}_${slotId}`;
    setUpdatingKey(key);

    try {
      await ScheduleService.toggleSlotStatus(date, slotId, nextStatus);
      setLocalScheduleList((prev) =>
        prev.map((item) => {
          if (item.date === date) {
            const updatedSlots = {
              ...item.slots,
              [slotId]: {
                ...item.slots[slotId],
                isActive: nextStatus,
                isAvailable: nextStatus,
              },
            };
            return { ...item, slots: updatedSlots };
          }
          return item;
        })
      );
      onRefresh();
    } catch (err) {
      console.error('Error toggling slot:', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#059669]" />
              Kitchen Schedule Matrix Controller
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Toggle operational dates and fine-tune meal slot capacities for customer pre-orders.
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          {localScheduleList.map((dayItem) => {
            const dateObj = new Date(dayItem.date);
            const dateFormatted = dateObj.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const isDateActive = Boolean(dayItem.isDateActive);

            return (
              <div
                key={dayItem.date}
                className={`border rounded-2xl p-5 space-y-4 transition-all ${
                  isDateActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-black text-slate-900">{dateFormatted}</span>
                    <span className="text-xs font-bold text-slate-400">({dayItem.date})</span>
                  </div>

                  <button
                    onClick={() => handleToggleDate(dayItem.date, isDateActive)}
                    disabled={updatingKey === dayItem.date}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      isDateActive ? 'bg-emerald-100 text-[#059669] hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {updatingKey === dayItem.date ? 'Updating...' : isDateActive ? 'Kitchen OPEN' : 'Kitchen CLOSED'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MEAL_SLOTS.map((slot) => {
                    const slotData = dayItem.slots ? dayItem.slots[slot.id] : undefined;
                    const isSlotActive = slotData ? Boolean(slotData.isActive && (slotData.isAvailable ?? true)) : true;
                    const maxOrders = slotData?.maxCapacity || slotData?.maxOrders || 40;
                    const currentOrders = slotData?.currentOrders || 0;
                    const key = `${dayItem.date}_${slot.id}`;

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between text-xs space-y-3 ${
                          !isDateActive || !isSlotActive
                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{slot.name}</span>
                          <span className="text-[10px] text-slate-500">{slot.nameTamil}</span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Capacity:</span>
                            <span className="font-extrabold text-slate-800">{currentOrders} / {maxOrders}</span>
                          </div>
                        </div>

                        <button
                          disabled={!isDateActive || updatingKey === key}
                          onClick={() => handleToggleSlot(dayItem.date, slot.id, isSlotActive)}
                          className={`w-full py-2 rounded-lg font-black text-[11px] transition-all ${
                            !isSlotActive
                              ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                              : 'bg-[#059669] text-white hover:bg-[#047857]'
                          }`}
                        >
                          {updatingKey === key ? '...' : isSlotActive ? 'Slot ACTIVE' : 'Slot DISABLED'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
