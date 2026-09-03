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
  Loader2,
  UtensilsCrossed
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/store/cartStore';
import { OrderService } from '@/services/api';
import { supabase } from '@/lib/supabaseClient';

export default function CustomerOrdersPage() {
  const { customerPhone } = useCartStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerOrders = async () => {
    try {
      // 1. Attempt Supabase Auth user check
      const { data: { user } } = await supabase.auth.getUser();

      let supabaseOrders: any[] = [];

      if (user) {
        // Query orders strictly where user_id matches auth.uid()
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          supabaseOrders = data;
        }
      }

      // 2. Fallback to API OrderService by phone if authenticated Supabase search yielded 0
      if (supabaseOrders.length === 0) {
        const apiData = await OrderService.getOrders({ phone: customerPhone || undefined });
        if (apiData && apiData.orders) {
          supabaseOrders = apiData.orders;
        }
      }

      setOrders(supabaseOrders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, [customerPhone]);

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
            <div className="flex items-center space-x-2 text-xs font-bold text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 w-fit mb-2">
              <PackageCheck className="w-4 h-4 text-[#059669]" />
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
            href="/storefront"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-[#059669] hover:border-emerald-300 shadow-sm transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Today&apos;s Menu</span>
          </Link>
        </div>

        {/* Orders Container */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#059669] animate-spin mx-auto" />
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
                        <span className="font-mono font-black text-lg text-slate-900">{order.orderNumber || order.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-[10px] font-black uppercase">
                          {order.paymentMethod || 'COD'} • {order.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Booking Date: <span className="font-bold text-slate-800">{order.bookingDate || order.created_at?.split('T')[0]}</span> ({order.slotType || 'LUNCH'})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Total Payable</span>
                      <span className="text-xl font-black text-[#059669]">₹{order.totalAmount || order.total_amount}</span>
                    </div>
                  </div>

                  {/* Clean Status Timeline */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#059669]" />
                      Live Kitchen Status Timeline
                    </h3>

                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                      {/* Step 1: Accepted */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 1 ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 1 ? 'text-slate-900 font-black' : 'text-slate-400'}>Accepted</span>
                      </div>

                      {/* Step 2: Preparing */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 2 ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20 animate-pulse' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 2 ? 'text-[#059669] font-black' : 'text-slate-400'}>Preparing</span>
                      </div>

                      {/* Step 3: Out for Delivery */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 3 ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className={currentStep >= 3 ? 'text-slate-900 font-black' : 'text-slate-400'}>On The Way</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          currentStep >= 4 ? 'bg-[#059669] text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-400'
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
                            <span className="font-extrabold">₹{order.totalAmount || order.total_amount}</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 pt-3 sm:pt-0">
                      <h4 className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#059669]" /> Delivery Address:
                      </h4>
                      <p className="font-semibold text-slate-700">{order.deliveryAddress || order.delivery_address || order.address || 'Address not specified'}</p>

                      <div className="pt-2">
                        <Link
                          href={`/track/${order.id}`}
                          className="inline-flex items-center gap-1 font-extrabold text-[#059669] hover:underline text-xs"
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
            /* Clean Empty State Requirement */
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-5 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto border border-emerald-100">
                <UtensilsCrossed className="w-10 h-10 text-[#059669]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-black text-slate-900 tracking-tight">
                  No Orders Placed Yet
                </h3>
                <p className="text-xs font-extrabold text-[#059669]">
                  நீங்கள் இன்னும் எந்த உணவும் ஆர்டர் செய்யவில்லை
                </p>
                <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                  Your order history is completely empty. Explore Chef Yazhisai&apos;s active calendar slots to book your first home-cooked meal!
                </p>
              </div>
              <div>
                <Link
                  href="/storefront"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all"
                >
                  <span>Browse Today&apos;s Menu</span>
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
