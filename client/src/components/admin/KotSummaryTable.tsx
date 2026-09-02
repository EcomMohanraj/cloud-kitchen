'use client';

import React from 'react';
import { ChefHat, Printer, Utensils } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

interface KotSummaryTableProps {
  orders: any[];
  selectedDate: string;
  selectedSlot: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
}

export const KotSummaryTable: React.FC<KotSummaryTableProps> = ({
  orders,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
}) => {
  const itemTotalsMap: Record<string, { menuItemName: string; totalQuantity: number; orderCount: number }> = {};

  orders.forEach((order) => {
    if (order.orderStatus !== 'CANCELLED') {
      order.items.forEach((item: any) => {
        if (!itemTotalsMap[item.menuItemName]) {
          itemTotalsMap[item.menuItemName] = {
            menuItemName: item.menuItemName,
            totalQuantity: 0,
            orderCount: 0,
          };
        }
        itemTotalsMap[item.menuItemName].totalQuantity += item.quantity;
        itemTotalsMap[item.menuItemName].orderCount += 1;
      });
    }
  });

  const aggregateList = Object.values(itemTotalsMap);

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Controls & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            Yazhisai Kitchen Slip (KOT) Preparation Aggregator
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Calculates exact ingredient prep quantities for selected date and session slot.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print KOT Slip</span>
        </button>
      </div>

      {/* Date & Slot Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Prep Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Meal Session Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => onSlotChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
          >
            {MEAL_SLOTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.nameTamil})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregated Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-200 flex justify-between items-center text-xs font-extrabold text-emerald-900">
          <span>Dish Name</span>
          <div className="flex space-x-12">
            <span>Orders Count</span>
            <span>Total Portions to Cook</span>
          </div>
        </div>

        {aggregateList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Utensils className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No active orders for this date & slot</p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Select another date or meal slot above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {aggregateList.map((item) => (
              <div key={item.menuItemName} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm">{item.menuItemName}</span>
                </div>

                <div className="flex items-center space-x-16">
                  <span className="text-slate-600 font-bold">{item.orderCount} orders</span>
                  <span className="text-xl font-black text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-lg border border-emerald-300">
                    {item.totalQuantity} portions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
