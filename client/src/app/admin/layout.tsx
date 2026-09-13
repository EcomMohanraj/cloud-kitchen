'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Menu, ChefHat, Sparkles } from 'lucide-react';
import { OrderAlertNotifier, OrderAlertNotifierRef } from '@/components/admin/OrderAlertNotifier';
import { getSocket, joinAdminRoom } from '@/services/socket';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const alertNotifierRef = useRef<OrderAlertNotifierRef>(null);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (isLogin) return;

    // 1. Singleton Socket.io Connection & Admin Room Join
    const socket = getSocket();
    joinAdminRoom();

    // 2. Global New Order Socket Event Listener (Persists Uninterrupted Across All Admin Sub-Routes)
    const handleNewOrder = (data: { order: any }) => {
      const newOrder = data.order;
      console.log('⚡ [Admin Global Layout Notifier] Received new-order socket event:', newOrder);

      // Trigger Global Sound Alert + Full-Screen Acknowledgment Modal across any active admin page
      alertNotifierRef.current?.triggerAlert(newOrder);
    };

    socket.on('new-order', handleNewOrder);

    return () => {
      socket.off('new-order', handleNewOrder);
    };
  }, [isLogin]); // Only re-runs if transitioning to/from login page, NOT on sub-route changes!

  // Do not render sidebar/header shell on login page
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative">
      {/* Admin Sidebar Component (Responsive Drawer) */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Unified Top Header (Rendered ONCE across Mobile & Desktop - SINGLETON ALERT NOTIFIER) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-none">Chef Admin Matrix</span>
                <span className="text-[10px] text-emerald-700 font-bold">Yazhisai Cloud Kitchen</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* SINGLETON ORDER ALERT NOTIFIER INSTANCE */}
            <OrderAlertNotifier ref={alertNotifierRef} />

            <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-900 border border-emerald-200 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Live Console</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
