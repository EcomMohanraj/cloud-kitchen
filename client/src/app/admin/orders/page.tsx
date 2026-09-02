'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  ChefHat,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ORDER_STATUSES, MEAL_SLOTS } from '@/lib/constants';
import { OrderService } from '@/services/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      const data = await OrderService.getOrders({
        date: selectedDateFilter || undefined,
        slot: selectedSlotFilter !== 'ALL' ? selectedSlotFilter : undefined,
      });

      if (data.orders) setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedDateFilter, selectedSlotFilter]);

  const handleUpdateStatus = async (orderId: string, orderStatus: string) => {
    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
    );

    try {
      await OrderService.updateOrderStatus(orderId, orderStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
    );

    try {
      await OrderService.updateOrderStatus(orderId, undefined, paymentStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  // Filtered Orders Calculation
  const filteredOrders = orders.filter((o) => {
    if (statusTab === 'ACTIVE') {
      return ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.orderStatus);
    }
    if (statusTab === 'DELIVERED') {
      return o.orderStatus === 'DELIVERED';
    }
    if (statusTab === 'CANCELLED') {
      return o.orderStatus === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kitchen Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-mint-400" />
            Live Pre-Order Management Matrix
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 max-w-2xl font-medium">
            Manage customer pre-orders in real-time. Transition states through Accept → Cook → Dispatch → Delivered.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/15 flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Feed</span>
        </button>
      </div>

      {/* Filter Bar: Status Tabs & Dropdowns */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-card-soft space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Quick Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                statusTab === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Orders ({orders.length})
            </button>

            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                statusTab === 'ACTIVE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Prep ({orders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length})
            </button>

            <button
              onClick={() => setStatusTab('DELIVERED')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                statusTab === 'DELIVERED'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Delivered ({orders.filter((o) => o.orderStatus === 'DELIVERED').length})
            </button>

            <button
              onClick={() => setStatusTab('CANCELLED')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                statusTab === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancelled ({orders.filter((o) => o.orderStatus === 'CANCELLED').length})
            </button>
          </div>

          {/* Date & Slot Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
              />
            </div>

            <div>
              <select
                value={selectedSlotFilter}
                onChange={(e) => setSelectedSlotFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
              >
                <option value="ALL">All Meal Slots</option>
                {MEAL_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Orders Cards Feed Grid */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200/80 rounded-3xl p-8 text-slate-500 text-xs shadow-card-soft space-y-3">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300" />
            <h4 className="text-base font-extrabold text-slate-800">No Orders in this View</h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Customer orders placed on the storefront will appear here automatically in real time.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentStatus = order.orderStatus || 'PENDING';
            const isCOD = order.paymentMethod === 'COD';
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <div
                key={order.id}
                className="bg-white border border-emerald-100/90 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover transition-all space-y-5"
              >
                {/* Top Row: Order Number & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-black text-white bg-emerald-600 px-3.5 py-1.5 rounded-2xl shadow-sm">
                      {order.orderNumber}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{order.customerName}</h3>
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> {order.customerPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left sm:text-right text-xs">
                      <span className="text-emerald-700 font-bold block">{order.bookingDate}</span>
                      <span className="text-slate-500 font-semibold">{order.slotType} Slot Window</span>
                    </div>

                    <div className="text-left sm:text-right px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Bill</span>
                      <span className="text-lg font-black text-emerald-800">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Body Details: Items & Delivery Address */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                  
                  {/* Left Column: Ordered Items List */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                      Customer Ordered Dishes:
                    </h4>

                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, idx: number) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-800 font-semibold"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                                {item.quantity}x
                              </span>
                              <span className="font-extrabold text-sm">{item.menuItemName}</span>
                            </div>
                            <span className="font-black text-slate-900">₹{item.totalPrice || item.subtotal || item.unitPrice * item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-500 font-semibold">
                          Standard Gourmet Meal Package
                        </div>
                      )}
                    </div>

                    {/* Delivery Address Pill */}
                    <div className="flex items-start gap-2 pt-2 text-slate-700 font-semibold bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold uppercase block">Delivery Address:</span>
                        <span className="text-xs text-slate-900">{order.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Lifecycle Action Controls */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-slate-700 uppercase tracking-wider text-[11px] mb-3">
                        One-Click Order Lifecycle Transition:
                      </h4>

                      <div className="space-y-2">
                        {/* ACCEPT ORDER */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'ACCEPTED'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> 1. Accept Order
                          </span>
                          {currentStatus === 'ACCEPTED' && <span className="text-[10px] uppercase font-black">Active</span>}
                        </button>

                        {/* START COOKING */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'PREPARING'
                              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50 hover:border-amber-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <ChefHat className="w-4 h-4" /> 2. Start Cooking
                          </span>
                          {currentStatus === 'PREPARING' && <span className="text-[10px] uppercase font-black">Active</span>}
                        </button>

                        {/* OUT FOR DELIVERY */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-teal-50 hover:border-teal-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4" /> 3. Out for Delivery
                          </span>
                          {currentStatus === 'OUT_FOR_DELIVERY' && <span className="text-[10px] uppercase font-black">Active</span>}
                        </button>

                        {/* MARK DELIVERED */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'DELIVERED'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> 4. Mark Delivered
                          </span>
                          {currentStatus === 'DELIVERED' && <span className="text-[10px] uppercase font-black font-black">Completed</span>}
                        </button>
                      </div>
                    </div>

                    {/* Payment Status Switch */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">
                          Payment ({isCOD ? 'Cash on Delivery' : 'Online UPI'}):
                        </span>
                        <button
                          onClick={() => handleUpdatePaymentStatus(order.id, isPaid ? 'PENDING' : 'PAID')}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {isPaid ? '✓ PAID' : 'PENDING'}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
