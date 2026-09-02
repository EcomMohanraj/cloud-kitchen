'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { OrderStatusTracker } from '@/components/OrderStatusTracker';
import { OrderService } from '@/services/api';
import { Clock, AlertCircle } from 'lucide-react';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const data = await OrderService.getOrders({ id: orderId });
      const foundOrder = data.orders && data.orders.length > 0 ? data.orders[0] : null;
      if (foundOrder) {
        setOrder(foundOrder);
        setError('');
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Poll every 5s for real-time status updates
      const interval = setInterval(fetchOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Clock className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
            <p className="text-base font-extrabold text-slate-800">Fetching live order status...</p>
          </div>
        ) : error || !order ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-lg font-black text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 font-semibold">{error || 'Please check your tracking link.'}</p>
          </div>
        ) : (
          <OrderStatusTracker order={order} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-700">
          Yazhisai Cloud Kitchen Live Order Tracker &copy; 2026
        </p>
      </footer>
    </div>
  );
}
