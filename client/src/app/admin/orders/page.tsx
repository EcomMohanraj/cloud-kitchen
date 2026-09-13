'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  RefreshCw,
  Calendar,
  Package,
  UserCheck,
  Banknote,
} from 'lucide-react';
import { ORDER_STATUSES, MEAL_SLOTS } from '@/lib/constants';
import { OrderService } from '@/services/api';
import { getSocket, joinAdminRoom } from '@/services/socket';
import { OrderAlertNotifier, OrderAlertNotifierRef } from '@/components/admin/OrderAlertNotifier';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}

export default function AdminOrdersPage() {
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();
  const tomorrowStr = getTomorrowDateString();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  const alertNotifierRef = useRef<OrderAlertNotifierRef>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  
  // Date filter defaults to Today (or stored sessionStorage value)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('yazhisai_admin_order_date_filter');
      if (saved !== null) {
        return saved;
      }
    }
    return todayStr;
  });

  const [selectedSlotFilter, setSelectedSlotFilter] = useState('ALL');

  const updateDateFilter = (newDate: string) => {
    setSelectedDateFilter(newDate);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('yazhisai_admin_order_date_filter', newDate);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await OrderService.getOrders({
        date: selectedDateFilter || undefined,
        slot: selectedSlotFilter !== 'ALL' ? selectedSlotFilter : undefined,
      });

      if (data.fetchFailed) {
        console.warn('⚠️ [Admin UI] API fetch failed, preserving current orders in state.');
        return;
      }

      if (data.orders) {
        setOrders((prev) => {
          if (prev.length === 0) return data.orders;

          // Atomic merge preserving real-time socket orders and avoiding flicker
          const map = new Map(prev.map((o) => [o.id, o]));
          data.orders.forEach((o: any) => {
            map.set(o.id, o);
          });

          const merged = Array.from(map.values());
          merged.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          return merged;
        });
      }
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Join Socket.io Admin Room
    const socket = getSocket();
    joinAdminRoom();

    // 2. Handle Real-Time New Order Emission
    const handleNewOrder = (data: { order: any }) => {
      const newOrder = data.order;
      console.log('⚡ [Admin UI] Received new-order socket event:', newOrder);

      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      setNewOrderToast(`🔔 New Order Received: #${newOrder.orderNumber || newOrder.id} from ${newOrder.customerName}!`);
      setTimeout(() => setNewOrderToast(null), 5000);

      // Trigger Sound Alert + Full-Screen Acknowledgment Modal
      alertNotifierRef.current?.triggerAlert(newOrder);
    };

    // 3. Handle Real-Time Order Status Update Emission
    const handleStatusUpdated = (data: { order: any }) => {
      const updated = data.order;
      console.log('⚡ [Admin UI] Received order-status-updated socket event:', updated);

      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleStatusUpdated);

    // Background safety fallback refresh every 30s
    const fallbackTimer = setInterval(fetchOrders, 30000);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleStatusUpdated);
      clearInterval(fallbackTimer);
    };
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

  // Filtered Orders Calculation (Combining Slot, Date & Status with AND logic)
  const dateAndSlotFilteredOrders = orders.filter((o) => {
    if (selectedSlotFilter !== 'ALL' && o.slotType !== selectedSlotFilter) {
      return false;
    }
    if (selectedDateFilter && o.bookingDate !== selectedDateFilter) {
      return false;
    }
    return true;
  });

  const filteredOrders = dateAndSlotFilteredOrders.filter((o) => {
    if (['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(o.orderStatus)) {
      return false;
    }
    if (statusTab === 'ACTIVE') {
      return ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus);
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
      {newOrderToast && (
        <div className="bg-amber-400 text-slate-950 px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-between animate-bounce border-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🛎️</span>
            <span>{newOrderToast}</span>
          </div>
          <button
            onClick={() => setNewOrderToast(null)}
            className="text-xs font-bold bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      
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

        <div className="flex items-center space-x-3 self-start md:self-auto shrink-0">
          <OrderAlertNotifier ref={alertNotifierRef} />
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/15 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Feed</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Status Tabs & Date Quick Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-card-soft space-y-4">
        {/* Row 1: Status Quick Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statusTab === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders ({dateAndSlotFilteredOrders.length})
          </button>

          <button
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statusTab === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active Prep ({dateAndSlotFilteredOrders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length})
          </button>

          <button
            onClick={() => setStatusTab('DELIVERED')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statusTab === 'DELIVERED'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Delivered ({dateAndSlotFilteredOrders.filter((o) => o.orderStatus === 'DELIVERED').length})
          </button>

          <button
            onClick={() => setStatusTab('CANCELLED')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statusTab === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled ({dateAndSlotFilteredOrders.filter((o) => o.orderStatus === 'CANCELLED').length})
          </button>
        </div>

        {/* Row 2: Date Quick-Select Shortcuts + Date Picker & Slot Filter Dropdowns */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Quick Date Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Date:
            </span>

            <button
              onClick={() => updateDateFilter(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDateFilter === todayStr
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => updateDateFilter(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDateFilter === yesterdayStr
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Yesterday
            </button>

            <button
              onClick={() => updateDateFilter(tomorrowStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDateFilter === tomorrowStr
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tomorrow
            </button>

            <button
              onClick={() => updateDateFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDateFilter === ''
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>
          </div>

          {/* Date Input & Slot Filter Dropdowns */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => updateDateFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
            />

            <select
              value={selectedSlotFilter}
              onChange={(e) => setSelectedSlotFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
            >
              <option value="ALL">All Meal Slots</option>
              {MEAL_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
                      <a
                        href={`tel:${order.customerPhone ? String(order.customerPhone).replace(/\s+/g, '') : ''}`}
                        className="text-xs text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5 transition-colors cursor-pointer"
                        title="Click to call customer phone"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> {order.customerPhone}
                      </a>
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

                        {/* READY FOR PICKUP */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'READY_FOR_PICKUP'
                              ? 'bg-purple-600 text-white shadow-md font-black'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" /> 3. Ready for Pickup
                          </span>
                          {currentStatus === 'READY_FOR_PICKUP' && <span className="text-[10px] uppercase font-black">Food Packed</span>}
                        </button>

                        {/* ADMIN SELF-DELIVER FALLBACK BUTTON */}
                        {currentStatus === 'READY_FOR_PICKUP' && !order.deliveryPartnerId && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            className="w-full py-2 px-3 rounded-xl font-black text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md flex items-center justify-between transition-all border border-amber-500"
                          >
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4" /> No Rider — Self-Deliver (Admin Direct)
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md">Direct</span>
                          </button>
                        )}

                        {/* OUT FOR DELIVERY INFORMATIONAL BADGE */}
                        <div
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4" /> 4. Out for Delivery
                            {order.deliveryPartner ? (
                              <span className="text-[11px] font-bold text-teal-200 ml-1">
                                ({order.deliveryPartner.name} - {order.deliveryPartner.phone})
                              </span>
                            ) : null}
                          </span>
                          {currentStatus === 'OUT_FOR_DELIVERY' && <span className="text-[10px] uppercase font-black">In Transit</span>}
                        </div>

                        {/* MARK DELIVERED BADGE */}
                        <div
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'DELIVERED'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> 5. Delivered
                            {order.deliveryPartner ? (
                              <span className="text-[11px] font-bold text-emerald-100 ml-1">
                                (by Rider: {order.deliveryPartner.name})
                              </span>
                            ) : currentStatus === 'DELIVERED' ? (
                              <span className="text-[11px] font-bold text-amber-200 ml-1">(Admin Direct Delivery)</span>
                            ) : null}
                          </span>
                          {currentStatus === 'DELIVERED' && <span className="text-[10px] uppercase font-black font-black">Completed</span>}
                        </div>
                      </div>
                    </div>

                    {/* Payment Status & COD Cash Collection Controls */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          {isCOD && <Banknote className="w-3.5 h-3.5 text-amber-600" />}
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
                          {isPaid ? (isCOD ? '✓ COD Cash Collected' : '✓ Online PAID') : (isCOD ? '⏳ COD Cash Pending' : 'PENDING')}
                        </button>
                      </div>

                      {/* Manual Admin Cash Collection Button for COD Orders */}
                      {isCOD && !isPaid && ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentStatus) && (
                        <button
                          onClick={async () => {
                            try {
                              await OrderService.markCashCollected(order.id);
                              fetchOrders();
                            } catch (err) {
                              console.error('Failed to mark cash collected:', err);
                              handleUpdatePaymentStatus(order.id, 'PAID');
                            }
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all border border-amber-500"
                        >
                          <Banknote className="w-4 h-4 text-slate-950" />
                          <span>Mark Cash Collected (₹{order.totalAmount})</span>
                        </button>
                      )}

                      {/* Collection Metadata info if available */}
                      {isPaid && order.paymentCollectedBy && (
                        <div className="text-[10px] text-slate-500 font-semibold italic text-right">
                          Collected by: {order.paymentCollectedBy}
                        </div>
                      )}
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
