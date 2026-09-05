export const MEAL_SLOTS = [
  {
    id: 'BREAKFAST',
    name: 'Breakfast',
    nameTamil: 'காலை உணவு',
    timeRange: '07:00 AM - 10:30 AM',
    iconName: 'Sun',
    orderCutoff: '06:00 AM',
    defaultCutoff: '10:30 AM',
  },
  {
    id: 'LUNCH',
    name: 'Lunch',
    nameTamil: 'மதிய உணவு',
    timeRange: '12:30 PM - 03:30 PM',
    iconName: 'Utensils',
    orderCutoff: '11:00 AM',
    defaultCutoff: '03:30 PM',
  },
  {
    id: 'SNACKS',
    name: 'Snacks & Tea Break',
    nameTamil: 'மாலை சிற்றுண்டி',
    timeRange: '04:30 PM - 06:30 PM',
    iconName: 'Coffee',
    orderCutoff: '03:30 PM',
    defaultCutoff: '06:30 PM',
  },
  {
    id: 'DINNER',
    name: 'Dinner',
    nameTamil: 'இரவு உணவு',
    timeRange: '07:30 PM - 10:30 PM',
    iconName: 'Moon',
    orderCutoff: '06:00 PM',
    defaultCutoff: '10:00 PM',
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
