'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  ChefHat,
  Truck,
  ShoppingBag,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/store/cartStore';
import { OrderService } from '@/services/api';

export default function CustomerOrdersPage() {
  const { customerName, customerPhone } = useCartStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerOrders = async () => {
    try {
      const data = await OrderService.getOrders();
      if (data && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
    const timer = setInterval(() => {
      fetchCustomerOrders();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 w-fit mb-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Customer Order History • நேரலை ஆர்டர்கள்</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              My Meal Bookings
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Track live food prep status, delivery windows, and order invoices.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Book New Meal Slot</span>
          </Link>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">Loading your meal bookings...</p>
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const currentStep = getStatusStep(order.orderStatus || order.status || 'PENDING');

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-black text-lg text-slate-900">{order.orderNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {order.paymentMethod} • {order.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Booking Date: <span className="font-bold text-slate-800">{order.bookingDate || order.date}</span> ({order.slotType || order.slot})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Total Payable</span>
                      <span className="text-xl font-black text-emerald-800">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Clean Status Timeline (Accepted -> Preparing -> Out for Delivery -> Delivered) */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Live Kitchen Status Timeline
                    </h3>

                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                      {/* Step 1: Accepted */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 1 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 1 ? 'text-slate-900 font-black' : 'text-slate-400'}>Accepted</span>
                      </div>

                      {/* Step 2: Preparing */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 2 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 animate-pulse' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 2 ? 'text-emerald-800 font-black' : 'text-slate-400'}>Preparing</span>
                      </div>

                      {/* Step 3: Out for Delivery */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 3 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 3 ? 'text-slate-900 font-black' : 'text-slate-400'}>On The Way</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 4 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 4 ? 'text-slate-900 font-black' : 'text-slate-400'}>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">Dishes Ordered:</h4>
                      <ul className="space-y-1 font-semibold text-slate-800">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((it: any, idx: number) => {
                            const itemName = it.menuItemName || it.name || 'Gourmet Dish';
                            const itemQty = it.quantity || it.qty || 1;
                            const itemPrice = it.totalPrice || (it.price ? it.price * itemQty : (it.unitPrice || 120) * itemQty);
                            return (
                              <li key={idx} className="flex justify-between border-b border-slate-100 pb-1">
                                <span>{itemName} x {itemQty}</span>
                                <span className="font-extrabold">₹{itemPrice}</span>
                              </li>
                            );
                          })
                        ) : (
                          <li className="flex justify-between border-b border-slate-100 pb-1">
                            <span>Fresh Pre-Order Package</span>
                            <span className="font-extrabold">₹{order.totalAmount}</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 pt-3 sm:pt-0">
                      <h4 className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Delivery Address:
                      </h4>
                      <p className="font-semibold text-slate-700">{order.deliveryAddress || order.address}</p>

                      <div className="pt-2">
                        <Link
                          href={`/track/${order.id}`}
                          className="inline-flex items-center gap-1 font-extrabold text-emerald-700 hover:text-emerald-800 text-xs"
                        >
                          <span>Full Live Tracking Screen</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Orders Placed Yet</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Explore Chef Yazhisai&apos;s active calendar slots and place your first gourmet meal order.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
              >
                <span>Browse Menu Calendar</span>
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
