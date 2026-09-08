'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Utensils, ClipboardList, ChefHat, Truck, LogOut, ArrowLeft, X, Star } from 'lucide-react';
import { AuthService } from '@/services/api';
import { useCartStore } from '@/store/cartStore';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutCustomer } = useCartStore();

  const navItems = [
    { href: '/admin', label: 'Overview Dashboard', icon: LayoutDashboard },
    { href: '/admin/schedule', label: 'Calendar & Slot Engine', icon: Calendar },
    { href: '/admin/menu', label: 'Menu Management', icon: Utensils },
    { href: '/admin/orders', label: 'Live Orders Board', icon: ClipboardList },
    { href: '/admin/kot', label: 'Kitchen Slip (KOT)', icon: ChefHat },
    { href: '/admin/riders', label: 'Delivery Partners', icon: Truck },
    { href: '/admin/reviews', label: 'Customer Reviews', icon: Star },
  ];

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yazhisai_admin_jwt');
      localStorage.removeItem('yazhisai_admin_active');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'yazhisai_admin_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'yazhisai_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    try {
      await AuthService.logout();
    } catch (e) {
      console.error(e);
    }
    logoutCustomer();
    if (onClose) onClose();
    router.push('/admin/login');
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white border-r border-slate-200">
      <div className="p-6">
        {/* Brand */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin" onClick={onClose} className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base leading-none">Chef Portal</h2>
              <p className="text-[10px] text-emerald-700 font-bold mt-1">Yazhisai Kitchen</p>
            </div>
          </Link>

          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-6 border-t border-slate-200 space-y-3 bg-slate-50/50">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Storefront</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-extrabold text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/60"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Logout Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 shadow-sm z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose}></div>
          <div className="relative w-64 max-w-full h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
