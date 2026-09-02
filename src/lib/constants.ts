export interface SlotDefinition {
  id: string; // 'BREAKFAST' | 'SNACKS' | 'LUNCH' | 'DINNER'
  name: string;
  nameTamil: string;
  timeRange: string;
  badgeColor: string;
  activeColor: string;
  iconName: string;
}

export const MEAL_SLOTS: SlotDefinition[] = [
  {
    id: 'BREAKFAST',
    name: 'Breakfast',
    nameTamil: 'காலை உணவு',
    timeRange: '07:00 AM - 10:30 AM',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    activeColor: 'from-amber-500 to-amber-600 text-white shadow-glow',
    iconName: 'Sun',
  },
  {
    id: 'SNACKS',
    name: 'Snacks & Break',
    nameTamil: 'சிற்றுண்டி',
    timeRange: '11:00 AM - 12:30 PM & 04:30 PM - 06:30 PM',
    badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    activeColor: 'from-orange-500 to-orange-600 text-white shadow-glow-spice',
    iconName: 'Coffee',
  },
  {
    id: 'LUNCH',
    name: 'Lunch',
    nameTamil: 'மதிய உணவு',
    timeRange: '12:30 PM - 03:30 PM',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    activeColor: 'from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    iconName: 'Utensils',
  },
  {
    id: 'DINNER',
    name: 'Dinner',
    nameTamil: 'இரவு உணவு',
    timeRange: '07:00 PM - 10:30 PM',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    activeColor: 'from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20',
    iconName: 'Moon',
  },
];

export const ORDER_STATUSES = [
  { key: 'PENDING', label: 'Pending', labelTamil: 'நிலுவையில்', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  { key: 'ACCEPTED', label: 'Accepted', labelTamil: 'ஏற்றுக்கொள்ளப்பட்டது', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { key: 'PREPARING', label: 'Preparing in Kitchen', labelTamil: 'சமைக்கப்படுகிறது', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', labelTamil: 'டெலிவரிக்கு புறப்பட்டது', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { key: 'DELIVERED', label: 'Delivered', labelTamil: 'டெலிவரி செய்யப்பட்டது', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { key: 'CANCELLED', label: 'Cancelled', labelTamil: 'ரத்து செய்யப்பட்டது', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
];
