'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { OrderStatusTracker } from '@/components/OrderStatusTracker';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Poll every 10 seconds for real-time status updates
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading live order status...</p>
          </div>
        ) : error || !order ? (
          <div className="py-16 text-center bg-dark-800/50 border border-white/10 rounded-2xl space-y-3">
            <p className="text-lg font-bold text-red-400">{error || 'Order not found'}</p>
            <p className="text-xs text-slate-400">Please check your order link or contact kitchen support.</p>
          </div>
        ) : (
          <OrderStatusTracker order={order} />
        )}

      </main>

      <footer className="border-t border-white/10 bg-dark-950 py-6 text-center text-xs text-slate-500">
        Annapoorna Cloud Kitchen Live Tracking System &copy; 2026
      </footer>
    </div>
  );
}
