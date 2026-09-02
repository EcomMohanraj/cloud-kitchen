'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DatePicker, ScheduleDate } from '@/components/DatePicker';
import { SlotPills } from '@/components/SlotPills';
import { MenuCard, MenuItemProps } from '@/components/MenuCard';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { PaymentModal } from '@/components/PaymentModal';
import { useCartStore } from '@/store/cartStore';
import { Sparkles, Utensils, ShieldCheck, Flame, HeartHandshake, Lock } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

export default function StorefrontPage() {
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot } = useCartStore();

  const [scheduleList, setScheduleList] = useState<ScheduleDate[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [onlinePaymentOrder, setOnlinePaymentOrder] = useState<any>(null);

  // Fetch Schedule Data
  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      if (data.schedule && data.schedule.length > 0) {
        setScheduleList(data.schedule);

        // Auto-select first active date if current selectedDate is not active
        const currentActiveObj = data.schedule.find((s: ScheduleDate) => s.date === selectedDate && s.isDateActive);
        if (!currentActiveObj) {
          const firstActive = data.schedule.find((s: ScheduleDate) => s.isDateActive);
          if (firstActive) {
            setSelectedDate(firstActive.date);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Fetch Menu Items dynamically when selectedSlot changes
  const fetchMenu = async (slot: string) => {
    setMenuLoading(true);
    try {
      const res = await fetch(`/api/menu?slot=${slot}`);
      const data = await res.json();
      if (data.items) {
        setMenuItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Find slot status for current selected date
  const currentDateSchedule = scheduleList.find((s) => s.date === selectedDate);
  const currentSlotStatuses = currentDateSchedule ? currentDateSchedule.slots : undefined;
  const isDateActive = Boolean(currentDateSchedule?.isDateActive);

  // Automatically adjust selectedSlot if current selectedSlot is disabled for selectedDate
  useEffect(() => {
    if (currentSlotStatuses && isDateActive) {
      const isCurrentSlotActive = Boolean(
        currentSlotStatuses[selectedSlot]?.isActive && (currentSlotStatuses[selectedSlot]?.isAvailable ?? true)
      );

      if (!isCurrentSlotActive) {
        // Find first active slot
        const activeSlotKey = MEAL_SLOTS.find(
          (s) => currentSlotStatuses[s.id]?.isActive && (currentSlotStatuses[s.id]?.isAvailable ?? true)
        )?.id;

        if (activeSlotKey) {
          setSelectedSlot(activeSlotKey);
        }
      }
    }
  }, [selectedDate, currentSlotStatuses, isDateActive, selectedSlot, setSelectedSlot]);

  useEffect(() => {
    if (selectedSlot) {
      fetchMenu(selectedSlot);
    }
  }, [selectedSlot]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-200/30 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Yazhisai Home-Cooked Schedule Pre-Ordering</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Authentic Home Delicacies, <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">Cooked Fresh On-Demand.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong className="text-emerald-800">Yazhisai Cloud Kitchen (யாழிசை கிளவுட் கிச்சன்)</strong>. Our kitchen operates strictly on chef-enabled calendar dates and meal slots for peak freshness and quality.
          </p>

          {/* Value Props */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Home Cooked Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-600" />
              <span>Zero Preservatives</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Hygiene Certified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 flex-1 w-full">
        
        {/* Step 1: Interactive Green & White Date Picker */}
        <DatePicker scheduleData={scheduleList} loading={scheduleLoading} />

        {/* Step 2: 4 Meal Slot Category Selector */}
        <SlotPills slotStatuses={currentSlotStatuses} isDateActive={isDateActive} />

        {/* Step 3: Dynamic Menu Catalog */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                3. Available Menu Items
                <span className="text-xs text-slate-500 font-semibold ml-2">({menuItems.length} dishes for {selectedSlot})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each dish is portioned and cooked fresh specifically for the selected slot window.
              </p>
            </div>
          </div>

          {!isDateActive ? (
            <div className="py-16 text-center text-slate-600 bg-rose-50/80 border border-rose-200 rounded-2xl p-8 space-y-3 shadow-sm">
              <Lock className="w-12 h-12 mx-auto text-rose-600 mb-2" />
              <h3 className="text-lg font-black text-slate-900">Kitchen is Closed on {selectedDate}</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Chef Yazhisai is taking a day off on this calendar date. Please choose an active green-highlighted date above.
              </p>
            </div>
          ) : menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse"></div>
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Utensils className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-base font-extrabold text-slate-800">No menu items found for this slot</p>
              <p className="text-xs text-slate-500 mt-1">Please select another meal slot above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenOnlinePayment={(order) => setOnlinePaymentOrder(order)}
      />

      {/* Online Payment Gateway Simulator Modal */}
      <PaymentModal
        order={onlinePaymentOrder}
        isOpen={!!onlinePaymentOrder}
        onClose={() => setOnlinePaymentOrder(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700">
            Yazhisai Cloud Kitchen (யாழிசை கிளவுட் கிச்சன்) &copy; 2026. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500">
            Designed for schedule-driven home culinary operations with automated slot cutoff engines.
          </p>
        </div>
      </footer>

    </div>
  );
}
