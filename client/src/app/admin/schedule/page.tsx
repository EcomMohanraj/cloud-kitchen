'use client';

import React, { useEffect, useState } from 'react';
import { ScheduleCalendar } from '@/components/admin/ScheduleCalendar';
import { ScheduleService } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function AdminSchedulePage() {
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      const data = await ScheduleService.getSchedule();
      if (data.schedule) setScheduleList(data.schedule);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold">Loading Kitchen Calendar & Slot Schedule...</p>
      </div>
    );
  }

  return <ScheduleCalendar scheduleList={scheduleList} onRefresh={fetchSchedule} />;
}
