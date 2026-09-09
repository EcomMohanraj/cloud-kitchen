'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Utensils,
  ClipboardList,
  ChefHat,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Filter,
  BarChart3,
  CreditCard,
  Banknote,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { OrderService, ScheduleService, MenuService, AnalyticsService } from '@/services/api';

function getTodayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getDaysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Analytics Filter States
  const [startDate, setStartDate] = useState<string>(getDaysAgoStr(6)); // Default Last 7 Days
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [activePreset, setActivePreset] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  const fetchAnalyticsData = useCallback(async (start: string, end: string) => {
    setAnalyticsLoading(true);
    try {
      const data = await AnalyticsService.getRevenueAnalytics(start, end);
      setAnalytics(data);
    } catch (error) {
      console.error('Revenue analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

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
    fetchAnalyticsData(startDate, endDate);
  }, [fetchAnalyticsData, startDate, endDate]);

  const handlePresetSelect = (preset: 'today' | '7days' | '30days') => {
    setActivePreset(preset);
    const end = getTodayStr();
    let start = end;

    if (preset === '7days') {
      start = getDaysAgoStr(6);
    } else if (preset === '30days') {
      start = getDaysAgoStr(29);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
  };

  const activeDatesCount = schedule.filter((s) => s.isDateActive).length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'PENDING' || o.orderStatus === 'ACCEPTED').length;

  const maxDailyRevenue = analytics?.dailyBreakdown
    ? Math.max(...analytics.dailyBreakdown.map((d: any) => d.revenue), 1)
    : 1;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            Yazhisai Kitchen Overview & Revenue Analytics
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Real-time financial performance, pre-order metrics, and kitchen readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Manage Orders Board</span>
          </Link>
        </div>
      </div>

      {/* ─── REVENUE ANALYTICS SECTION ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Revenue Analytics Dashboard</h2>
                <p className="text-xs text-slate-500 font-semibold">Filter total revenue and order volume by custom date ranges</p>
              </div>
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            {/* Presets */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handlePresetSelect('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activePreset === 'today'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activePreset === '7days'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activePreset === '30days'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="py-12 flex items-center justify-center space-x-2 text-slate-500 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Calculating financial analytics...</span>
          </div>
        ) : (
          <>
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-emerald-100">
                  <span className="text-xs font-extrabold uppercase tracking-wider">Total Filtered Revenue</span>
                  <IndianRupee className="w-5 h-5 opacity-90" />
                </div>
                <div className="text-3xl font-black">₹{analytics?.totalRevenue || 0}</div>
                <div className="text-[11px] font-bold text-emerald-100 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>PAID status orders ({analytics?.startDate} ~ {analytics?.endDate})</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">Paid Order Count</span>
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{analytics?.totalOrderCount || 0}</div>
                <div className="text-[11px] text-slate-500 font-semibold">Confirmed transactions</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">Cash on Delivery (COD)</span>
                  <Banknote className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{analytics?.paymentMethodBreakdown?.COD?.revenue || 0}
                </div>
                <div className="text-[11px] text-emerald-800 font-bold">
                  {analytics?.paymentMethodBreakdown?.COD?.orderCount || 0} orders collected
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">Online Payments (Razorpay)</span>
                  <CreditCard className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{analytics?.paymentMethodBreakdown?.ONLINE?.revenue || 0}
                </div>
                <div className="text-[11px] text-teal-800 font-bold">
                  {analytics?.paymentMethodBreakdown?.ONLINE?.orderCount || 0} orders verified
                </div>
              </div>
            </div>

            {/* Daily Breakdown Visual Chart & Table */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Daily Revenue & Volume Breakdown ({analytics?.dailyBreakdown?.length || 0} Days)
              </h3>

              {/* Bar Chart Visualization */}
              {analytics?.dailyBreakdown && analytics.dailyBreakdown.length > 0 && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-end gap-2 h-40 sm:h-48 pt-6 pb-2 overflow-x-auto">
                    {analytics.dailyBreakdown.map((item: any) => {
                      const heightPercent = Math.max(8, Math.round((item.revenue / maxDailyRevenue) * 100));
                      return (
                        <div
                          key={item.date}
                          className="flex-1 min-w-[36px] flex flex-col items-center justify-end h-full group relative"
                        >
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-lg">
                            {item.date}: ₹{item.revenue} ({item.orderCount} orders)
                          </div>

                          <div className="text-[10px] font-extrabold text-slate-700 mb-1 group-hover:text-emerald-700">
                            ₹{item.revenue}
                          </div>

                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-xl transition-all duration-300 ${
                              item.revenue > 0
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 shadow-sm'
                                : 'bg-slate-200'
                            }`}
                          ></div>

                          <div className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                            {item.date.slice(5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Daily Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4 font-bold">Date</th>
                      <th className="py-3 px-4 font-bold text-center">Total Orders</th>
                      <th className="py-3 px-4 font-bold text-right">COD Revenue</th>
                      <th className="py-3 px-4 font-bold text-right">Online Revenue</th>
                      <th className="py-3 px-4 font-bold text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {analytics?.dailyBreakdown && analytics.dailyBreakdown.length > 0 ? (
                      analytics.dailyBreakdown.map((row: any) => (
                        <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.date}</td>
                          <td className="py-3 px-4 font-bold text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                              {row.orderCount} orders
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-right text-emerald-800">
                            ₹{row.codRevenue || 0}
                          </td>
                          <td className="py-3 px-4 font-bold text-right text-teal-800">
                            ₹{row.onlineRevenue || 0}
                          </td>
                          <td className="py-3 px-4 font-black text-right text-slate-900 text-sm">
                            ₹{row.revenue}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">
                          No revenue recorded for the selected date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── KITCHEN OVERVIEW CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Total Customer Orders</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{orders.length}</div>
          <div className="text-[11px] text-amber-700 font-bold">{pendingOrdersCount} pending kitchen prep</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Active Calendar Dates</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {activeDatesCount} / {schedule.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">Enabled for customer pre-orders</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Active Menu Catalog</span>
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
                    <span
                      className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                        o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
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
