export const MEAL_SLOTS = [
  {
    id: 'BREAKFAST',
    name: 'Breakfast',
    nameTamil: 'காலை உணவு',
    timeRange: '07:00 AM - 10:30 AM',
    iconName: 'Sun',
    defaultCutoff: '06:30 AM',
  },
  {
    id: 'SNACKS',
    name: 'Snacks & Break',
    nameTamil: 'சிற்றுண்டி',
    timeRange: '11:00 AM - 12:30 PM & 04:30 PM - 06:30 PM',
    iconName: 'Coffee',
    defaultCutoff: '10:00 AM',
  },
  {
    id: 'LUNCH',
    name: 'Lunch',
    nameTamil: 'மதிய உணவு',
    timeRange: '12:30 PM - 03:30 PM',
    iconName: 'Utensils',
    defaultCutoff: '11:00 AM',
  },
  {
    id: 'DINNER',
    name: 'Dinner',
    nameTamil: 'இரவு உணவு',
    timeRange: '07:00 PM - 10:30 PM',
    iconName: 'Moon',
    defaultCutoff: '05:30 PM',
  },
];

export const ORDER_STATUSES = [
  { key: 'PENDING', label: 'Pending Kitchen Approval' },
  { key: 'ACCEPTED', label: 'Order Accepted' },
  { key: 'PREPARING', label: 'Cooking in Progress' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];
