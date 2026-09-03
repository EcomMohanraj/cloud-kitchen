import { useState, useEffect } from 'react';
import { ScheduleService } from '@/services/api';
import { ScheduleDate } from '@/components/DatePicker';

export function useSlots() {
  const [schedule, setSchedule] = useState<ScheduleDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ScheduleService.getSchedule()
      .then((data) => {
        if (data.schedule) setSchedule(data.schedule);
      })
      .catch((err) => console.error('useSlots error:', err))
      .finally(() => setLoading(false));
  }, []);

  return { schedule, loading };
}
