'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Utensils, ClipboardList, ChefHat, IndianRupee, TrendingUp, ArrowRight } from 'lucide-react';
import { OrderService, ScheduleService, MenuService } from '@/services/api';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [ordersData, scheduleData, menuData] = await Promise.all([
        OrderService.getOrders(),
        ScheduleService.getSchedule(),
        MenuService.getMenuItems(undefined, true),
      ]);

      if (ordersData.orders) setOrders(ordersData.orders);
      if (scheduleData.schedule) setSchedule(scheduleData.schedule);
      if (menuData.items) setMenuItems(menuData.items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.orderStatus !== 'CANCELLED' ? o.totalAmount : 0), 0);
  const activeDatesCount = schedule.filter((s) => s.isDateActive).length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'ACCEPTED').length;

  return (
    <div className="space-y-8 text-slate-900">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-emerald-600" />
          Yazhisai Kitchen Overview Dashboard
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Real-time pre-order stats, kitchen prep readiness, and schedule performance.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">₹{totalRevenue}</div>
          <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live sales calculated
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Pre-Orders Count</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{orders.length}</div>
          <div className="text-[11px] text-amber-700 font-bold">
            {pendingOrdersCount} pending kitchen prep
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Active Calendar Dates</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{activeDatesCount} / {schedule.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold">Enabled for customer orders</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Menu Catalog</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{menuItems.length}</div>
          <div className="text-[11px] text-slate-500 font-semibold">Dishes across 4 meal slots</div>
        </div>

      </div>

      {/* Quick Access Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/schedule"
          className="p-6 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-500 transition-all space-y-3 shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Manage Calendar & Slots &rarr;
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Toggle dates ON/OFF and manage granular meal slot availability for customers.
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="p-6 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-500 transition-all space-y-3 shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Live Orders Board &rarr;
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Track order status lifecycle: Pending &rarr; Accepted &rarr; Preparing &rarr; Delivered.
          </p>
        </Link>

        <Link
          href="/admin/kot"
          className="p-6 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-500 transition-all space-y-3 shadow-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Kitchen Slip (KOT) Summary &rarr;
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            View aggregated portion quantities to prepare for any selected session.
          </p>
        </Link>
      </div>

      {/* Recent Pre-orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Recent Customer Pre-Orders</h2>
          <Link href="/admin/orders" className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-bold">Order ID</th>
                <th className="pb-3 font-bold">Customer</th>
                <th className="pb-3 font-bold">Date & Slot</th>
                <th className="pb-3 font-bold">Payment</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="py-3.5 font-bold text-slate-900">{o.orderNumber}</td>
                  <td className="py-3.5">
                    <span className="font-bold text-slate-900 block">{o.customerName}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{o.customerPhone}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-emerald-700 font-bold">{o.bookingDate}</span> ({o.slotType})
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                      o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {o.paymentStatus} ({o.paymentMethod})
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-black text-slate-900">₹{o.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
