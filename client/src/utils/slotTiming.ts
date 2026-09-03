export interface SlotTiming {
  id: 'BREAKFAST' | 'SNACKS' | 'LUNCH' | 'DINNER';
  name: string;
  tamilName: string;
  timeWindow: string;
  icon: string;
}

export const SLOT_TIMINGS: Record<string, SlotTiming> = {
  BREAKFAST: {
    id: 'BREAKFAST',
    name: 'Breakfast',
    tamilName: 'காலை உணவு',
    timeWindow: '7:30 AM - 10:30 AM',
    icon: '🌅',
  },
  SNACKS: {
    id: 'SNACKS',
    name: 'Snacks & Beverages',
    tamilName: 'சிற்றுண்டி & பானங்கள்',
    timeWindow: '4:00 PM - 6:30 PM',
    icon: '☕',
  },
  LUNCH: {
    id: 'LUNCH',
    name: 'Lunch',
    tamilName: 'மதிய உணவு',
    timeWindow: '12:30 PM - 3:00 PM',
    icon: '🍛',
  },
  DINNER: {
    id: 'DINNER',
    name: 'Dinner',
    tamilName: 'இரவு உணவு',
    timeWindow: '7:30 PM - 10:00 PM',
    icon: '🌙',
  },
};

export function isSlotExpiredToday(dateStr: string, slotId: string): boolean {
  if (!dateStr) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateStr !== todayStr) return false;

  const now = new Date();
  const currentHours = now.getHours();

  switch (slotId) {
    case 'BREAKFAST':
      return currentHours >= 11;
    case 'LUNCH':
      return currentHours >= 15;
    case 'SNACKS':
      return currentHours >= 19;
    case 'DINNER':
      return currentHours >= 22;
    default:
      return false;
  }
}
