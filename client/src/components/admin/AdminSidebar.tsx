'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Utensils, ClipboardList, ChefHat, LogOut, ArrowLeft } from 'lucide-react';
import { AuthService } from '@/services/api';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/admin', label: 'Overview Dashboard', icon: LayoutDashboard },
    { href: '/admin/schedule', label: 'Calendar & Slot Engine', icon: Calendar },
    { href: '/admin/menu', label: 'Menu Management', icon: Utensils },
    { href: '/admin/orders', label: 'Live Orders Board', icon: ClipboardList },
    { href: '/admin/kot', label: 'Kitchen Slip (KOT)', icon: ChefHat },
  ];

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.error(e);
    }
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shadow-sm">
      <div className="p-6">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-base leading-none">Chef Portal</h2>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Yazhisai Kitchen</p>
          </div>
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
      <div className="p-6 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Storefront</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-extrabold text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Logout Admin</span>
        </button>
      </div>
    </aside>
  );
};
