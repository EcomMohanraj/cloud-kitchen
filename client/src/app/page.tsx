'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { DatePicker, ScheduleDate } from '@/components/DatePicker';
import { SlotPills } from '@/components/SlotPills';
import { MenuCard, MenuItemProps } from '@/components/MenuCard';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { PaymentModal } from '@/components/PaymentModal';
import { useCartStore } from '@/store/cartStore';
import { ScheduleService, MenuService } from '@/services/api';
import { Sparkles, Utensils, ShieldCheck, Flame, HeartHandshake, Lock, ShoppingBag, ArrowRight, ChefHat, CheckCircle2, Circle } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

import { isSlotExpiredToday, getFirstValidUpcomingSlot } from '@/utils/slotTiming';

// Format Date as local YYYY-MM-DD string to prevent UTC timezone shifts
function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function StorefrontPage() {
  const { selectedDate, selectedSlot, setSelectedDate, setSelectedSlot, getCartCount, getCartSubtotal, setIsCartOpen } = useCartStore();

  const [scheduleList, setScheduleList] = useState<ScheduleDate[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [onlinePaymentOrder, setOnlinePaymentOrder] = useState<any>(null);

  // Live Chef Status State
  const [isChefOnline, setIsChefOnline] = useState(true);
  const [kitchenStatus, setKitchenStatus] = useState<'OPEN' | 'BUSY' | 'OFFLINE'>('OPEN');

  const cartCount = getCartCount();
  const subtotal = getCartSubtotal();

  // Fetch Schedule Data from Backend
  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const data = await ScheduleService.getSchedule();
      if (data.schedule && data.schedule.length > 0) {
        setScheduleList(data.schedule);

        const todayKey = formatDateKey(new Date());
        let targetDate = selectedDate;

        const currentActiveObj = data.schedule.find((s: ScheduleDate) => s.date === selectedDate && s.isDateActive);
        if (!currentActiveObj || selectedDate < todayKey) {
          const todayActive = data.schedule.find((s: ScheduleDate) => s.date >= todayKey && s.isDateActive);
          if (todayActive) {
            targetDate = todayActive.date;
          } else {
            targetDate = data.schedule[0].date;
          }
        }
        setSelectedDate(targetDate);

        // Auto-select first valid open non-expired slot
        const validOpenSlot = getFirstValidUpcomingSlot(targetDate);
        if (validOpenSlot) {
          setSelectedSlot(validOpenSlot);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Fetch Menu Items when selectedSlot changes
  const fetchMenu = async (slot: string) => {
    setMenuLoading(true);
    try {
      const data = await MenuService.getMenuItems(slot);
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

  const currentDateSchedule = scheduleList.find((s) => s.date === selectedDate);
  const currentSlotStatuses = currentDateSchedule ? currentDateSchedule.slots : undefined;
  const isDateActive = currentDateSchedule ? Boolean(currentDateSchedule.isDateActive) : true;

  // Auto-shift slot if currently selected slot is inactive or expired
  useEffect(() => {
    if (currentSlotStatuses && isDateActive) {
      const currentCutoff = currentSlotStatuses[selectedSlot]?.cutoffTime || '10:30 AM';
      const isExpired = isSlotExpiredToday(currentCutoff, selectedDate);
      const isCurrentSlotActive = !isExpired && Boolean(
        currentSlotStatuses[selectedSlot]?.isActive && (currentSlotStatuses[selectedSlot]?.isAvailable ?? true)
      );

      if (!isCurrentSlotActive) {
        const activeSlotKey = MEAL_SLOTS.find((s) => {
          const slotCutoff = currentSlotStatuses[s.id]?.cutoffTime || '10:30 AM';
          const expired = isSlotExpiredToday(slotCutoff, selectedDate);
          return !expired && currentSlotStatuses[s.id]?.isActive && (currentSlotStatuses[s.id]?.isAvailable ?? true);
        })?.id;

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

  const activeSlotObj = MEAL_SLOTS.find((s) => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-900 font-sans">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-forest-900 via-emerald-900 to-teal-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              
              {/* LIVE CHEF STATUS BADGE */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold border border-white/15">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>
                  {isChefOnline
                    ? 'Chef Yazhisai Online • Accepting Fresh Pre-Orders'
                    : 'Chef Offline • Kitchen Currently Closed'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-tight">
                Authentic South Indian <br />
                <span className="text-mint-300">Home-Cooked Meals</span>
              </h1>
              
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                100% Zero Preservatives • Crafted fresh daily in small batch kitchen sessions. Reserve your operating meal slot below.
              </p>

              {/* Trust Badges Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-emerald-100">
                <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-mint-300" />
                  <span>100% Home Cooked</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Fresh Daily Batch</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <HeartHandshake className="w-4 h-4 text-rose-300" />
                  <span>Hygiene Certified</span>
                </div>
              </div>
            </div>

            {/* Quick Chef Card Widget */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 text-white space-y-3 shrink-0 lg:w-72">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg border-2 border-mint-300">
                  👨‍🍳
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Chef Yazhisai</h4>
                  <p className="text-[11px] text-emerald-200">Master Cloud Chef</p>
                </div>
              </div>
              <p className="text-xs text-emerald-100/80 leading-snug italic">
                &ldquo;Every dish is prepared using wood-pressed oils and hand-ground spices.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* STEP 1: HORIZONTAL DATE PICKER STRIP */}
        <section>
          <DatePicker scheduleData={scheduleList} loading={scheduleLoading} />
        </section>

        {/* STEP 2: MEAL SLOT PILLS */}
        <section>
          <SlotPills slotStatuses={currentSlotStatuses} isDateActive={isDateActive} />
        </section>

        {/* STEP 3: DYNAMIC MENU ITEMS CATALOG */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-emerald-100/80">
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-6 h-6 text-emerald-600" />
                Available Gourmet Menu
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {menuItems.length} dishes for {activeSlotObj?.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Dishes specifically prepared for the selected {activeSlotObj?.name} session on {selectedDate}.
              </p>
            </div>
          </div>

          {/* Grid Render */}
          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : menuItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <MenuCard key={item.id} item={item} disabled={!isDateActive} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3">
              <Lock className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-800">No Dishes Available for this Slot</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Chef Yazhisai has not listed items for this slot category on the selected date. Please pick another active slot.
              </p>
            </div>
          )}
        </section>

      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#059669] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-extrabold text-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center">
                {cartCount}
              </span>
              <span>View Tray Items</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black">₹{subtotal}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Drawers & Modals */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onProceedToPayment={(orderData) => {
          setIsCheckoutOpen(false);
          setOnlinePaymentOrder(orderData);
        }}
      />

      {onlinePaymentOrder && (
        <PaymentModal
          isOpen={Boolean(onlinePaymentOrder)}
          onClose={() => setOnlinePaymentOrder(null)}
          orderDetails={onlinePaymentOrder}
        />
      )}

    </div>
  );
}
