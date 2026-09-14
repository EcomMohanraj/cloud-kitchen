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
  Copy,
  Check,
} from 'lucide-react';
import { ORDER_STATUSES, MEAL_SLOTS } from '@/lib/constants';
import { OrderService } from '@/services/api';
import { getSocket, joinAdminRoom } from '@/services/socket';

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
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

  const handleCopyAddress = (orderId: string, address: string) => {
    if (!address) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedAddressId(orderId);
    setTimeout(() => setCopiedAddressId(null), 2000);
  };

  // Filters
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  
  // Cancel Order Modal State
  const [cancelTargetOrder, setCancelTargetOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Customer requested');

  // Date filter defaults to Today (or stored sessionStorage value)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('yazhisai_admin_date_filter');
      if (saved) return saved;
    }
    return todayStr;
  });

  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrders({
        date: selectedDateFilter !== 'ALL' ? selectedDateFilter : undefined,
        slot: selectedSlotFilter !== 'ALL' ? selectedSlotFilter : undefined,
      });

      if (data && data.fetchFailed) {
        console.warn('⚠️ [Admin UI] API fetch failed, preserving current orders in state.');
        return;
      }

      // Filter out unpaid Razorpay online orders
      const rawOrders = data?.orders || data || [];
      const visibleOrders = rawOrders.filter((ord: any) => {
        if (ord.paymentMethod === 'ONLINE' && ord.paymentStatus === 'PENDING') {
          return false;
        }
        if (ord.paymentStatus === 'FAILED') {
          return false;
        }
        return true;
      });

      setOrders(visibleOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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

  const handleUpdateStatus = async (orderId: string, orderStatus: string, paymentStatus?: string) => {
    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, orderStatus, ...(paymentStatus ? { paymentStatus } : {}) }
          : o
      )
    );

    try {
      await OrderService.updateOrderStatus(orderId, orderStatus, paymentStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    const orderId = cancelTargetOrder.id;

    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'CANCELLED' } : o))
    );

    try {
      await OrderService.updateOrderStatus(orderId, 'CANCELLED', undefined, cancelReason);
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancelTargetOrder(null);
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

  // Filter orders by tab selection
  const filteredOrders = orders.filter((order) => {
    if (['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(order.orderStatus)) {
      return false;
    }
    if (statusTab === 'ACTIVE') {
      return order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED';
    }
    if (statusTab === 'DELIVERED') {
      return order.orderStatus === 'DELIVERED';
    }
    if (statusTab === 'CANCELLED') {
      return order.orderStatus === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-emerald-400" />
            Live Orders Command Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Real-time kitchen order processing, slot dispatching, and delivery workflow.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto shrink-0">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/15 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Board
          </button>
        </div>
      </div>

      {/* New Order Toast Notification */}
      {newOrderToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <span>{newOrderToast}</span>
          <button
            onClick={() => setNewOrderToast(null)}
            className="px-3 py-1 bg-slate-950 text-white rounded-xl text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Control Panel */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
            {(['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  statusTab === tab
                    ? tab === 'CANCELLED' ? 'bg-rose-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab === 'ALL' && 'All Orders'}
                {tab === 'ACTIVE' && '🔥 Active Kitchen Orders'}
                {tab === 'DELIVERED' && '✓ Delivered'}
                {tab === 'CANCELLED' && '🚫 Cancelled'}
              </button>
            ))}
          </div>

          {/* Date & Slot Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Quick Date Pills */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setSelectedDateFilter(yesterdayStr);
                  if (typeof window !== 'undefined') sessionStorage.setItem('yazhisai_admin_date_filter', yesterdayStr);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  selectedDateFilter === yesterdayStr ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yesterday
              </button>

              <button
                onClick={() => {
                  setSelectedDateFilter(todayStr);
                  if (typeof window !== 'undefined') sessionStorage.setItem('yazhisai_admin_date_filter', todayStr);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  selectedDateFilter === todayStr ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Today
              </button>

              <button
                onClick={() => {
                  setSelectedDateFilter(tomorrowStr);
                  if (typeof window !== 'undefined') sessionStorage.setItem('yazhisai_admin_date_filter', tomorrowStr);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  selectedDateFilter === tomorrowStr ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Custom Date Input Picker */}
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDateFilter === 'ALL' ? '' : selectedDateFilter}
                onChange={(e) => {
                  const val = e.target.value || 'ALL';
                  setSelectedDateFilter(val);
                  if (typeof window !== 'undefined') sessionStorage.setItem('yazhisai_admin_date_filter', val);
                }}
                className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none"
              />
              {selectedDateFilter !== 'ALL' && (
                <button
                  onClick={() => {
                    setSelectedDateFilter('ALL');
                    if (typeof window !== 'undefined') sessionStorage.removeItem('yazhisai_admin_date_filter');
                  }}
                  className="text-[10px] font-black text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Slot Dropdown Filter */}
            <select
              value={selectedSlotFilter}
              onChange={(e) => setSelectedSlotFilter(e.target.value)}
              className="bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Delivery Slots</option>
              {MEAL_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid Display */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Fetching live orders from kitchen engine...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-700 text-base">No Orders Match Selected Criteria</h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            Try switching the filter date or status tab above to view other kitchen orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentStatus = order.orderStatus || 'RECEIVED';
            const isCOD = order.paymentMethod === 'COD';
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-6"
              >
                {/* Order Top Meta Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono font-black text-sm tracking-wider">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {order.slotType || 'BREAKFAST'}
                    </span>

                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {order.bookingDate ? new Date(order.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                    </span>
                  </div>

                  {/* Customer Info Brief */}
                  <div className="flex items-center space-x-3 text-xs font-bold text-slate-700">
                    <span className="font-extrabold text-slate-900">{order.customerName}</span>
                    <span className="text-slate-400">•</span>
                    <a href={`tel:${order.customerPhone}`} className="text-emerald-700 hover:underline font-mono flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {order.customerPhone}
                    </a>
                  </div>
                </div>

                {/* Main Card Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Items List & Delivery Address */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Ordered Gourmet Items ({order.items?.length || 0})
                      </span>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                                {item.quantity}x
                              </span>
                              <span className="font-extrabold text-sm">{item.menuItemName}</span>
                            </div>
                            <span className="font-black text-slate-900">₹{item.totalPrice || item.subtotal || item.unitPrice * item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-500 font-semibold text-xs">
                          Standard Gourmet Meal Package
                        </div>
                      )}
                    </div>

                    {/* Delivery Address Pill */}
                    <div className="flex items-start justify-between gap-2 pt-2 text-slate-700 font-semibold bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-[10px] text-emerald-800 font-bold uppercase block">Delivery Address:</span>
                        <span className="text-xs text-slate-900">{order.deliveryAddress}</span>
                      </div>
                      <button
                        onClick={() => handleCopyAddress(order.id, order.deliveryAddress)}
                        type="button"
                        title="Copy delivery address to clipboard"
                        className="p-1.5 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-200 text-slate-600 hover:text-emerald-800 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAddressId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
                            <span className="text-[10px] font-black text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-600 hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>
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

                        {/* OUT FOR DELIVERY BUTTON / BADGE */}
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                          disabled={currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-teal-600 text-white shadow-md'
                              : currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'
                              ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-teal-50 hover:border-teal-300 cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4" /> 4. Out for Delivery
                            {order.deliveryPartner ? (
                              <span className="text-[11px] font-bold text-teal-200 ml-1">
                                ({order.deliveryPartner.name} - {order.deliveryPartner.phone})
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-1">
                                (Self-Deliver)
                              </span>
                            )}
                          </span>
                          {currentStatus === 'OUT_FOR_DELIVERY' && <span className="text-[10px] uppercase font-black">In Transit</span>}
                        </button>

                        {/* MARK DELIVERED BUTTON / BADGE */}
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              order.id,
                              'DELIVERED',
                              isCOD && !isPaid ? 'PAID' : undefined
                            )
                          }
                          disabled={currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'}
                          className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                            currentStatus === 'DELIVERED'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : currentStatus === 'CANCELLED'
                              ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> 5. Delivered
                            {order.deliveryPartner ? (
                              <span className="text-[11px] font-bold text-emerald-100 ml-1">
                                (by Rider: {order.deliveryPartner.name})
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">
                                (Admin Direct Delivery)
                              </span>
                            )}
                          </span>
                          {currentStatus === 'DELIVERED' && <span className="text-[10px] uppercase font-black">Completed</span>}
                        </button>

                        {/* CANCEL ORDER BUTTON */}
                        {currentStatus === 'CANCELLED' ? (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600" /> Order Cancelled
                            </span>
                            <span className="text-[10px] uppercase font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTargetOrder(order);
                              setCancelReason('Customer requested');
                            }}
                            disabled={currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'DELIVERED'}
                            className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between transition-all ${
                              currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'DELIVERED'
                                ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600" /> Cancel Order
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold">Admin Override</span>
                          </button>
                        )}
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

                      {/* Online Paid & Cancelled: Manual Refund Needed Flag */}
                      {currentStatus === 'CANCELLED' && !isCOD && isPaid && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-800 font-black">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>⚠️ Manual Refund Required</span>
                          </div>
                          <p className="text-[11px] text-amber-900/90 font-medium leading-tight">
                            This order was paid online via UPI/Razorpay. Please initiate manual refund from Razorpay Dashboard if customer is eligible.
                          </p>
                        </div>
                      )}

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
          })}
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelTargetOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Cancel Order #{cancelTargetOrder.orderNumber || cancelTargetOrder.id.slice(0, 8)}?
                </h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Are you sure you want to cancel this order from <span className="font-extrabold text-slate-900">{cancelTargetOrder.customerName}</span>? This will notify the customer tracking page in real-time.
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-extrabold text-slate-700">
                Select Cancellation Reason:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
              >
                <option value="Customer requested">Customer requested cancellation</option>
                <option value="Kitchen stock issue">Kitchen ingredient / stock unavailable</option>
                <option value="Test/duplicate order">Test or duplicate order</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all"
              >
                Keep Order Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
