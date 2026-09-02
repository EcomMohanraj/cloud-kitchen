'use client';

import React, { useEffect, useState } from 'react';
import { ScheduleCalendar } from '@/components/admin/ScheduleCalendar';
import { Loader2 } from 'lucide-react';

export default function AdminSchedulePage() {
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
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

  return (
    <div>
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading schedule engine...</p>
        </div>
      ) : (
        <ScheduleCalendar scheduleList={scheduleList} onRefresh={fetchSchedule} />
      )}
    </div>
  );
}
