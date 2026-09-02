'use client';

import React, { useEffect, useState } from 'react';
import { KotSummaryTable } from '@/components/admin/KotSummaryTable';

export default function AdminKotPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-09-02');
  const [selectedSlot, setSelectedSlot] = useState('BREAKFAST');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?date=${selectedDate}&slot=${selectedSlot}`);
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
  }, [selectedDate, selectedSlot]);

  return (
    <div>
      <KotSummaryTable
        orders={orders}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onDateChange={setSelectedDate}
        onSlotChange={setSelectedSlot}
      />
    </div>
  );
}
