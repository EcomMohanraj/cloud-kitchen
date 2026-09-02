'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardList, Phone, MapPin } from 'lucide-react';
import { ORDER_STATUSES, MEAL_SLOTS } from '@/lib/constants';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      let url = '/api/orders?';
      if (selectedDateFilter) url += `date=${selectedDateFilter}&`;
      if (selectedSlotFilter !== 'ALL') url += `slot=${selectedSlotFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDateFilter, selectedSlotFilter]);

  const handleUpdateStatus = async (orderId: string, orderStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            Yazhisai Live Pre-Order Management Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Transition order lifecycle states in real-time as dishes are prepared and dispatched.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
            />
          </div>

          <div>
            <select
              value={selectedSlotFilter}
              onChange={(e) => setSelectedSlotFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
            >
              <option value="ALL">All Slots</option>
              {MEAL_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs shadow-sm">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800">No orders match selected filters</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
            >
              {/* Order Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-black text-slate-900 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-300">
                    {order.orderNumber}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{order.customerName}</h3>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" /> {order.customerPhone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-emerald-700 font-bold block">{order.bookingDate}</span>
                    <span className="text-slate-500 font-semibold">{order.slotType} Slot</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-semibold">Total</span>
                    <span className="text-lg font-black text-slate-900">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Items & Delivery Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div className="md:col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-700">Ordered Items:</h4>
                  <div className="space-y-1.5">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                        <span>{item.quantity}x {item.menuItemName}</span>
                        <span className="font-extrabold">₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-1.5 pt-2 text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress} ({order.preferredTime})</span>
                  </div>
                </div>

                {/* Status Transition Selectors */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kitchen Order Status
                    </label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold shadow-sm"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Status ({order.paymentMethod})
                    </label>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold shadow-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
