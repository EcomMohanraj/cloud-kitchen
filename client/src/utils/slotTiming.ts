// utils/slotTiming.ts - Time-Based Auto-Cutoff Engine for Yazhisai Cloud Kitchen

export interface SlotWindow {
  type: 'BREAKFAST' | 'SNACKS' | 'LUNCH' | 'DINNER';
  label: string;
  tamilLabel: string;
  startTime: string; // e.g. "07:00"
  cutoffTime: string; // e.g. "10:30" (24hr format)
}

export const MEAL_SLOTS: SlotWindow[] = [
  { type: 'BREAKFAST', label: 'Breakfast', tamilLabel: 'காலை உணவு', startTime: '07:00', cutoffTime: '10:30' },
  { type: 'SNACKS', label: 'Snacks', tamilLabel: 'சிற்றுண்டி', startTime: '11:00', cutoffTime: '16:30' },
  { type: 'LUNCH', label: 'Lunch', tamilLabel: 'மதிய உணவு', startTime: '12:00', cutoffTime: '15:30' },
  { type: 'DINNER', label: 'Dinner', tamilLabel: 'இரவு உணவு', startTime: '18:30', cutoffTime: '22:00' },
];

/**
 * Checks if a slot cutoff time has expired for a given date.
 * Future dates are never expired. Past dates are always expired.
 * For TODAY: checks if current local time is past the cutoff time.
 */
export function isSlotExpiredToday(cutoffTimeStr: string, selectedDate: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Future dates are open for pre-ordering
  if (selectedDate > todayStr) return false;
  // Past dates are expired
  if (selectedDate < todayStr) return true;

  // For TODAY: check cutoff time
  try {
    let cutoffHour = 10;
    let cutoffMinute = 30;

    if (cutoffTimeStr.includes(':')) {
      const parts = cutoffTimeStr.replace(/(AM|PM)/i, '').trim().split(':');
      cutoffHour = Number(parts[0]);
      cutoffMinute = Number(parts[1] || 0);

      if (cutoffTimeStr.toUpperCase().includes('PM') && cutoffHour < 12) {
        cutoffHour += 12;
      } else if (cutoffTimeStr.toUpperCase().includes('AM') && cutoffHour === 12) {
        cutoffHour = 0;
      }
    }

    const cutoff = new Date();
    cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

    return now > cutoff;
  } catch (error) {
    return false;
  }
}

/**
 * Returns the first valid non-expired slot for the selected date.
 */
export function getFirstValidUpcomingSlot(selectedDate: string): string {
  const validSlot = MEAL_SLOTS.find((s) => !isSlotExpiredToday(s.cutoffTime, selectedDate));
  return validSlot ? validSlot.type : 'DINNER';
}
