'use client';

import React, { useEffect, useState } from 'react';
import { KotSummaryTable } from '@/components/admin/KotSummaryTable';
import { OrderService } from '@/services/api';
import { Loader2 } from 'lucide-react';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminKotPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [selectedSlot, setSelectedSlot] = useState('BREAKFAST');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrders({
        date: selectedDate,
        slot: selectedSlot,
      });

      if (data.orders) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate, selectedSlot]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold">Calculating KOT Aggregated Portions...</p>
        </div>
      ) : (
        <KotSummaryTable
          orders={orders}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onDateChange={(d) => setSelectedDate(d)}
          onSlotChange={(s) => setSelectedSlot(s)}
        />
      )}
    </div>
  );
}
