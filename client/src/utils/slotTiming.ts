// utils/slotTiming.ts - Time-Based Auto-Cutoff Engine for Yazhisai Cloud Kitchen

export interface SlotWindow {
  type: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  label: string;
  tamilLabel: string;
  deliveryWindow: string; // e.g. "07:00 AM – 10:30 AM"
  orderCutoffTime: string; // e.g. "06:00" (24hr format)
  orderCutoffDisplay: string; // e.g. "06:00 AM"
  startTime: string; // e.g. "07:00"
  cutoffTime: string; // e.g. "10:30" (delivery end 24hr format)
}

export const MEAL_SLOTS: SlotWindow[] = [
  {
    type: 'BREAKFAST',
    label: 'Breakfast',
    tamilLabel: 'காலை உணவு',
    deliveryWindow: '07:00 AM – 10:30 AM',
    orderCutoffTime: '06:00',
    orderCutoffDisplay: '06:00 AM',
    startTime: '07:00',
    cutoffTime: '10:30',
  },
  {
    type: 'LUNCH',
    label: 'Lunch',
    tamilLabel: 'மதிய உணவு',
    deliveryWindow: '12:30 PM – 03:30 PM',
    orderCutoffTime: '11:00',
    orderCutoffDisplay: '11:00 AM',
    startTime: '12:30',
    cutoffTime: '15:30',
  },
  {
    type: 'SNACKS',
    label: 'Snacks & Tea Break',
    tamilLabel: 'மாலை சிற்றுண்டி',
    deliveryWindow: '04:30 PM – 06:30 PM',
    orderCutoffTime: '15:30',
    orderCutoffDisplay: '03:30 PM',
    startTime: '16:30',
    cutoffTime: '18:30',
  },
  {
    type: 'DINNER',
    label: 'Dinner',
    tamilLabel: 'இரவு உணவு',
    deliveryWindow: '07:30 PM – 10:30 PM',
    orderCutoffTime: '18:00',
    orderCutoffDisplay: '06:00 PM',
    startTime: '19:30',
    cutoffTime: '22:00',
  },
];

const defaultOrderCutoffMap: Record<string, string> = {
  BREAKFAST: '06:00 AM',
  LUNCH: '11:00 AM',
  SNACKS: '03:30 PM',
  DINNER: '06:00 PM',
};

/**
 * Checks if a slot order cutoff time has expired for a given date.
 * Future dates are open for pre-ordering. Past dates are closed.
 * For TODAY: checks if current local time is past the order cutoff time.
 */
export function isSlotBookingClosed(
  orderCutoffTimeStr: string | null | undefined,
  selectedDate: string,
  slotType?: string
): boolean {
  const effectiveCutoffStr =
    orderCutoffTimeStr || (slotType ? defaultOrderCutoffMap[slotType] : null) || '06:00 AM';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Future dates are open for pre-ordering
  if (selectedDate > todayStr) return false;
  // Past dates are closed
  if (selectedDate < todayStr) return true;

  // For TODAY: check cutoff time
  try {
    let cutoffHour = 6;
    let cutoffMinute = 0;

    if (effectiveCutoffStr && effectiveCutoffStr.includes(':')) {
      const parts = effectiveCutoffStr.replace(/(AM|PM)/i, '').trim().split(':');
      cutoffHour = Number(parts[0]);
      cutoffMinute = Number(parts[1] || 0);

      if (effectiveCutoffStr.toUpperCase().includes('PM') && cutoffHour < 12) {
        cutoffHour += 12;
      } else if (effectiveCutoffStr.toUpperCase().includes('AM') && cutoffHour === 12) {
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
 * Backward compatibility alias for isSlotBookingClosed
 */
export function isSlotExpiredToday(cutoffTimeStr: string, selectedDate: string, slotType?: string): boolean {
  return isSlotBookingClosed(cutoffTimeStr, selectedDate, slotType);
}

/**
 * Returns the first valid open slot for the selected date, or null if no open slot exists.
 */
export function getFirstValidUpcomingSlot(selectedDate: string, slotStatuses?: Record<string, any>): string | null {
  const validSlot = MEAL_SLOTS.find((s) => {
    const customCutoff = slotStatuses?.[s.type]?.orderCutoffTime || s.orderCutoffDisplay;
    const isClosed = isSlotBookingClosed(customCutoff, selectedDate, s.type);
    const isActive = slotStatuses?.[s.type] ? Boolean(slotStatuses[s.type].isActive && (slotStatuses[s.type].isAvailable ?? true)) : true;
    return !isClosed && isActive;
  });
  return validSlot ? validSlot.type : null;
}


