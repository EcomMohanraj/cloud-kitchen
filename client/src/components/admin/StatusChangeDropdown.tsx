'use client';

import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { orderService } from '@/services/orderService';

interface StatusChangeDropdownProps {
  orderId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '⏳ Pending' },
  { value: 'ACCEPTED', label: '✅ Accepted' },
  { value: 'PREPARING', label: '👨‍🍳 Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: '🛵 On The Way' },
  { value: 'DELIVERED', label: '🎉 Delivered' },
  { value: 'CANCELLED', label: '❌ Cancelled' },
];

export const StatusChangeDropdown: React.FC<StatusChangeDropdownProps> = ({
  orderId,
  currentStatus,
  onStatusChange,
}) => {
  const [status, setStatus] = useState(currentStatus || 'PENDING');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-xs">
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className="appearance-none bg-slate-100 hover:bg-slate-200 border border-slate-300 font-extrabold text-slate-800 py-1.5 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:border-[#059669]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
};
