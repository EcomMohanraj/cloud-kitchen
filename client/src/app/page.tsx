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
import { ServiceAreaModal } from '@/components/ServiceAreaModal';
import { SignInPromptModal } from '@/components/SignInPromptModal';
import { useCartStore } from '@/store/cartStore';
import { ScheduleService, MenuService, ReviewService } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Sparkles, Utensils, ShieldCheck, Flame, HeartHandshake, Lock, ShoppingBag, ArrowRight, ChefHat, CheckCircle2, Circle, Star, Quote, BadgeCheck } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

import { isSlotBookingClosed, getFirstValidUpcomingSlot } from '@/utils/slotTiming';

// Format Date as local YYYY-MM-DD string to prevent UTC timezone shifts
function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { Footer } from '@/components/Footer';

export default function StorefrontPage() {
  const {
    selectedDate,
    selectedSlot,
    setSelectedDate,
    setSelectedSlot,
    getCartCount,
    getCartSubtotal,
    setIsCartOpen,
    isServiceAreaModalOpen,
    setIsServiceAreaModalOpen,
    isSignInPromptOpen,
    setIsSignInPromptOpen,
  } = useCartStore();

  const [scheduleList, setScheduleList] = useState<ScheduleDate[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [testimonials, setTestimonials] = useState<any[]>([]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [onlinePaymentOrder, setOnlinePaymentOrder] = useState<any>(null);

  // Live Chef Status State
  const [isChefOnline, setIsChefOnline] = useState(true);
  const [kitchenStatus, setKitchenStatus] = useState<'OPEN' | 'BUSY' | 'OFFLINE'>('OPEN');
  const [timeTick, setTimeTick] = useState<number>(Date.now());

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
        const targetScheduleObj = data.schedule.find((s: ScheduleDate) => s.date === targetDate);
        let validOpenSlot = getFirstValidUpcomingSlot(targetDate, targetScheduleObj?.slots);

        if (!validOpenSlot && targetDate === todayKey) {
          const nextActive = data.schedule.find((s: ScheduleDate) => {
            if (s.date <= todayKey || !s.isDateActive) return false;
            return Boolean(getFirstValidUpcomingSlot(s.date, s.slots));
          });
          if (nextActive) {
            targetDate = nextActive.date;
            setSelectedDate(targetDate);
            validOpenSlot = getFirstValidUpcomingSlot(targetDate, nextActive.slots);
          }
        }

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

    // Fetch homepage verified testimonials
    ReviewService.getTestimonials()
      .then((res) => {
        if (res.success && res.testimonials) {
          setTestimonials(res.testimonials);
        }
      })
      .catch((err) => console.warn('Testimonials load error:', err));

    const socket = getSocket();
    const handleScheduleUpdated = () => {
      console.log('⚡ [Storefront UI] Real-time schedule update event received');
      fetchSchedule();
    };

    socket.on('schedule-updated', handleScheduleUpdated);

    return () => {
      socket.off('schedule-updated', handleScheduleUpdated);
    };
  }, []);

  // Periodic time tick & focus listener to trigger lock evaluation as time passes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ [Storefront] Periodic 30s cutoff tick check at:', new Date().toLocaleTimeString());
      setTimeTick(Date.now());
    }, 30000);

    const handleFocusOrVisibility = () => {
      console.log('👁️ [Storefront] Window focus/visibility change tick check');
      setTimeTick(Date.now());
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  const currentDateSchedule = scheduleList.find((s) => s.date === selectedDate);
  const currentSlotStatuses = currentDateSchedule ? currentDateSchedule.slots : undefined;
  const isDateActive = currentDateSchedule ? Boolean(currentDateSchedule.isDateActive) : true;

  const currentSelectedCutoff = currentSlotStatuses?.[selectedSlot]?.orderCutoffTime || MEAL_SLOTS.find(s => s.id === selectedSlot)?.orderCutoff || '06:00 AM';
  const isSelectedSlotExpired = isSlotBookingClosed(currentSelectedCutoff, selectedDate, selectedSlot);

  // Auto-shift slot if currently selected slot is inactive or expired past order cutoff
  useEffect(() => {
    if (isDateActive) {
      const currentCutoff = currentSlotStatuses?.[selectedSlot]?.orderCutoffTime || MEAL_SLOTS.find(s => s.id === selectedSlot)?.orderCutoff || '06:00 AM';
      const isExpired = isSlotBookingClosed(currentCutoff, selectedDate, selectedSlot);
      const isCurrentSlotActive = !isExpired && Boolean(
        currentSlotStatuses ? (currentSlotStatuses[selectedSlot]?.isActive && (currentSlotStatuses[selectedSlot]?.isAvailable ?? true)) : true
      );

      if (!isCurrentSlotActive) {
        const activeSlotKey = getFirstValidUpcomingSlot(selectedDate, currentSlotStatuses);
        if (activeSlotKey && activeSlotKey !== selectedSlot) {
          setSelectedSlot(activeSlotKey);
        }
      }
    }
  }, [selectedDate, currentSlotStatuses, isDateActive, selectedSlot, setSelectedSlot, timeTick]);

  useEffect(() => {
    if (selectedSlot) {
      fetchMenu(selectedSlot);
    }
  }, [selectedSlot]);

  const activeSlotObj = MEAL_SLOTS.find((s) => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 font-sans">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Hero Section Banner */}
        <section className="relative rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-10 shadow-2xl overflow-hidden border border-emerald-800/40">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy & Info */}
            <div className="lg:col-span-7 space-y-5 text-left">
              
              {/* LIVE CHEF STATUS BADGE */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-extrabold border border-white/15 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>
                  {isChefOnline
                    ? 'Chef Yazhisai Online • Accepting Fresh Slot Pre-Orders'
                    : 'Chef Offline • Kitchen Currently Closed'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Authentic South Indian <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint-300 via-emerald-200 to-amber-300">
                  Home-Cooked Meals
                </span>
              </h1>
              
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-xl">
                100% Preservative-Free • Prepared fresh per session in small batches using wood-pressed oils and traditional hand-ground spices.
              </p>

              {/* Trust Badges Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-emerald-100">
                <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-mint-300" />
                  <span>100% Home Cooked</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Fresh Daily Sessions</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
                  <HeartHandshake className="w-4 h-4 text-rose-300" />
                  <span>Hygiene Certified</span>
                </div>
              </div>
            </div>

            {/* Right Food Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-emerald-900/60 backdrop-blur-md group">
                <img
                  src="https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80"
                  alt="Authentic South Indian Meals Showcase"
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-base border-2 border-mint-300 shadow-md">
                      👨‍🍳
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white drop-shadow">Chef Yazhisai</h4>
                      <p className="text-[11px] text-emerald-200 font-semibold drop-shadow">Master Cloud Kitchen Chef</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Signature Batch
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* STEP 1: HORIZONTAL DATE PICKER STRIP */}
        <section>
          <DatePicker scheduleData={scheduleList} loading={scheduleLoading} />
        </section>

        {/* STEP 2: MEAL SLOT PILLS */}
        <section>
          <SlotPills slotStatuses={currentSlotStatuses} isDateActive={isDateActive} timeTick={timeTick} />
        </section>

        {/* STEP 3: DYNAMIC MENU ITEMS CATALOG */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Utensils className="w-6 h-6 text-emerald-600" />
                Available Gourmet Menu
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
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
                <div key={i} className="h-80 bg-slate-200/70 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : menuItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  disabled={!isDateActive || isSelectedSlotExpired}
                  isSlotExpired={isSelectedSlotExpired}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <Lock className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-800">No Dishes Available for this Slot</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Chef Yazhisai has not listed items for this slot category on the selected date. Please pick another active slot.
              </p>
            </div>
          )}
        </section>

        {/* STEP 4: VERIFIED CUSTOMER TESTIMONIALS SECTION */}
        {testimonials.length > 0 && (
          <section className="pt-6 space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Verified Customer Testimonials</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                What Our Patrons Say
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Real feedback from verified food lovers who ordered and enjoyed our home-cooked meal sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((test: any) => (
                <div key={test.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-amber-400">
                        {Array.from({ length: test.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3 text-emerald-600" /> Verified Order
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                      &ldquo;{test.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900">{test.customerName}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">Dish: {test.dishName}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(test.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Modern Footer Component */}
      <Footer />

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

      <ServiceAreaModal
        isOpen={isServiceAreaModalOpen}
        onClose={() => setIsServiceAreaModalOpen(false)}
      />

      <SignInPromptModal
        isOpen={isSignInPromptOpen}
        onClose={() => setIsSignInPromptOpen(false)}
      />

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
