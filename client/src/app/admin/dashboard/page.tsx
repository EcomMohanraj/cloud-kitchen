'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  IndianRupee,
  ClipboardList,
  Calendar,
  ChefHat,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sun,
  Coffee,
  Utensils,
  Moon,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { orderService, AdminMetrics } from '@/services/orderService';
import { formatCurrency } from '@/utils/currency';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 10000);
    return () => clearInterval(timer);
  }, []);

  const totalSales = metrics?.total_sales || 0;
  const monthlySales = metrics?.monthly_sales || 0;
  const totalOrders = metrics?.total_orders || 0;
  const monthlyOrders = metrics?.monthly_orders || 0;
  const pendingOrders = metrics?.pending_orders || 0;
  const inProgressOrders = metrics?.in_progress_orders || 0;
  const deliveredOrders = metrics?.delivered_orders || 0;
  const cancelledOrders = metrics?.cancelled_orders || 0;
  const cookingLoad = metrics?.todays_cooking_load || 0;

  const breakfastCount = metrics?.slot_breakdown.breakfast || 0;
  const snacksCount = metrics?.slot_breakdown.snacks || 0;
  const lunchCount = metrics?.slot_breakdown.lunch || 0;
  const dinnerCount = metrics?.slot_breakdown.dinner || 0;

  const maxSlotOrders = Math.max(breakfastCount, snacksCount, lunchCount, dinnerCount, 1);

  return (
    <div className="space-y-8 text-slate-900 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 w-fit mb-2">
            <LayoutDashboard className="w-4 h-4 text-[#059669]" />
            <span>Real-Time Business Intelligence & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Kitchen Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Live revenue metrics, cooking batch workloads, and slot performance matrix.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-[#059669] hover:border-emerald-300 shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#059669]" /> : <TrendingUp className="w-4 h-4 text-[#059669]" />}
          <span>Refresh Live Metrics</span>
        </button>
      </div>

      {/* METRIC CARDS ROW 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Total Revenue / Sales */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-[11px] text-[#059669] font-extrabold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Monthly: {formatCurrency(monthlySales)}
            </p>
          </div>
        </div>

        {/* 2. Total Pre-Orders Count */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalOrders}</div>
            <p className="text-[11px] text-amber-700 font-extrabold mt-1">
              {pendingOrders + inProgressOrders} active in kitchen
            </p>
          </div>
        </div>

        {/* 3. Current Month Bookings */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Monthly Bookings</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{monthlyOrders}</div>
            <p className="text-[11px] text-slate-500 font-bold mt-1">Scheduled this month</p>
          </div>
        </div>

        {/* 4. Today's Active Cooking Load */}
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#059669] uppercase tracking-wider">Today&apos;s Prep Load</span>
            <div className="w-10 h-10 rounded-2xl bg-[#059669] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{cookingLoad} <span className="text-xs font-bold text-slate-500">meals</span></div>
            <p className="text-[11px] text-[#059669] font-extrabold mt-1">To cook & pack today</p>
          </div>
        </div>

      </div>

      {/* METRIC CARDS ROW 2: ORDER STATUS CATEGORIZATION */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Pending Approval</span>
            <div className="text-xl font-black text-slate-900">{pendingOrders}</div>
          </div>
          <Clock className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">In Preparation</span>
            <div className="text-xl font-black text-[#059669]">{inProgressOrders}</div>
          </div>
          <ChefHat className="w-6 h-6 text-[#059669] animate-pulse" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Delivered</span>
            <div className="text-xl font-black text-emerald-800">{deliveredOrders}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Cancelled</span>
            <div className="text-xl font-black text-rose-700">{cancelledOrders}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-500" />
        </div>

      </div>

      {/* METRIC SECTION 3: SLOT PERFORMANCE MATRIX */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#059669]" />
            Meal Slot Performance Matrix
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Order volume distribution across operating session windows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Breakfast */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Breakfast</h4>
                  <p className="text-[10px] text-slate-500 font-bold">காலை உணவு</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-900">{breakfastCount}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(breakfastCount / maxSlotOrders) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Snacks */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Snacks & Beverages</h4>
                  <p className="text-[10px] text-slate-500 font-bold">சிற்றுண்டி</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-900">{snacksCount}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#059669] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(snacksCount / maxSlotOrders) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Lunch */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Lunch</h4>
                  <p className="text-[10px] text-slate-500 font-bold">மதிய உணவு</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-900">{lunchCount}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(lunchCount / maxSlotOrders) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Dinner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Dinner</h4>
                  <p className="text-[10px] text-slate-500 font-bold">இரவு உணவு</p>
                </div>
              </div>
              <span className="text-lg font-black text-slate-900">{dinnerCount}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(dinnerCount / maxSlotOrders) * 100}%` }}
              ></div>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/schedule"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#059669] transition-all space-y-2 shadow-sm group"
        >
          <h3 className="font-serif font-black text-base text-slate-900 group-hover:text-[#059669] flex items-center gap-1.5">
            Shift & Slot Controller <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Toggle date availability and manage maximum meal slot capacities.
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#059669] transition-all space-y-2 shadow-sm group"
        >
          <h3 className="font-serif font-black text-base text-slate-900 group-hover:text-[#059669] flex items-center gap-1.5">
            Live KOT Orders Engine <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Manage order preparation statuses: Pending &rarr; Preparing &rarr; Delivered.
          </p>
        </Link>

        <Link
          href="/admin/menu"
          className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#059669] transition-all space-y-2 shadow-sm group"
        >
          <h3 className="font-serif font-black text-base text-slate-900 group-hover:text-[#059669] flex items-center gap-1.5">
            Gourmet Menu Manager <ArrowRight className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Add or update dishes, prices, preparation times, and slot categories.
          </p>
        </Link>
      </div>

    </div>
  );
}
