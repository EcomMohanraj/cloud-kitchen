'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  ShoppingBag,
  User,
  Calendar,
  Layers,
  ClipboardList,
  ChefHat,
  X,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ShieldCheck,
  LogOut,
  Truck
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { AuthService } from '@/services/api';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { cartItems, setIsCartOpen, customerName, setCustomerProfile, logoutCustomer, loadSavedProfile } = useCartStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Customer Form State
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userSaved, setUserSaved] = useState(false);
  const [userError, setUserError] = useState('');

  const [mounted, setMounted] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Mark as mounted after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
    loadSavedProfile();

    const handleCustomerSessionExpired = (e: any) => {
      if (!localStorage.getItem('token')) return;
      console.log('🔒 [Navbar] Customer session expired event received:', e.detail);
      setIsAuthModalOpen(true);
      setUserError(e.detail?.message || 'Your session expired. Please sign in again.');
      setAuthTab('SIGN_IN');
    };

    window.addEventListener('customer-session-expired', handleCustomerSessionExpired);
    return () => {
      window.removeEventListener('customer-session-expired', handleCustomerSessionExpired);
    };
  }, [loadSavedProfile]);

  // Customer Routes
  const customerRoutes = [
    { href: '/', label: 'Storefront', icon: UtensilsCrossed },
    { href: '/orders', label: 'My Orders', icon: PackageCheck },
    { href: '/account', label: 'Account', icon: User },
  ];

  const routes = customerRoutes;

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSaved(false);

    if (authTab === 'SIGN_UP' && (!fullName || fullName.length < 2)) {
      setUserError('Full Name must be at least 2 characters.');
      return;
    }

    if (!userEmail || !userEmail.includes('@')) {
      setUserError('Please enter a valid email address.');
      return;
    }

    if (!userPassword || userPassword.length < 4) {
      setUserError('Password must be at least 4 characters.');
      return;
    }

    if (authTab === 'SIGN_UP') {
      try {
        const data = await AuthService.registerCustomer({
          name: fullName,
          phone: userPhone || '9876543210',
          email: userEmail,
        });
        setCustomerProfile(data.user?.name || fullName, data.user?.phone || userPhone || '9876543210', data.user?.address || '');
        setUserSaved(true);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setUserSaved(false);
          router.push('/');
        }, 800);
      } catch (err: any) {
        setUserError(err.message || 'Registration failed');
      }
    } else {
      // SIGN_IN tab
      try {
        const data = await AuthService.loginCustomer({ email: userEmail, password: userPassword });
        const savedName = data.user?.name || fullName || userEmail.split('@')[0];
        const savedPhone = data.user?.phone || userPhone || '9876543210';
        setCustomerProfile(savedName, savedPhone, data.user?.address || '');
        setUserSaved(true);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setUserSaved(false);
          router.push('/');
        }, 800);
      } catch (err: any) {
        setUserError(err.message || 'Sign in failed');
      }
    }
  };

  // Render Desktop Navigation Logic
  const renderDesktopNav = () => {
    return (
      <div className="hidden lg:flex items-center space-x-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 font-bold hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-mint-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform duration-200">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Yazhisai <span className="text-emerald-700 font-extrabold">Cloud Kitchen</span>
                </span>
                <span className="block text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-0.5">
                  யாழிசை மனையக உணவகம்
                </span>
              </div>
            </Link>

            {/* Navigation Routes Bar */}
            {renderDesktopNav()}

            {/* Right Side Buttons: Auth Trigger & Tray Cart Button */}
            <div className="flex items-center space-x-3">
              
              {/* User Account or Login Buttons */}
              {mounted && (
                customerName ? (
                  <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Welcome</span>
                      <span className="text-sm font-black text-slate-800">{customerName}</span>
                    </div>
                    <button
                      onClick={() => logoutCustomer()}
                      className="p-2 sm:px-4 sm:py-2 rounded-xl bg-rose-50 text-rose-600 font-extrabold hover:bg-rose-100 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#067a46] hover:bg-[#046137] text-white font-black shadow-md transition-all flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )
              )}

              {/* Cart Tray Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-mint-500 hover:from-emerald-700 hover:to-mint-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 group"
              >
                <ShoppingBag className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Tray</span>
                {cartCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center shadow-sm animate-bounce">
                    {cartCount}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden border-t border-emerald-100/60 bg-white/90 px-4 py-2 flex items-center justify-around overflow-x-auto no-scrollbar space-x-2 text-[11px] font-bold text-slate-600">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  isActive ? 'bg-emerald-600 text-white font-black' : 'hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>

      </header>

      {/* Unified Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-900 text-center p-6 sm:p-8 space-y-5">
            
            {/* Top Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top SECURE ACCESS Pill Badge */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-800 tracking-wider uppercase mb-2">
                SECURE ACCESS
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {authTab === 'SIGN_IN'
                  ? 'Welcome Back'
                  : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {authTab === 'SIGN_IN'
                  ? 'Sign in to manage addresses and orders'
                  : 'Create an account for instant ordering'}
              </p>
            </div>

            {/* Mode Switcher Tabs - Hidden if session expired */}
            {!userError?.includes('session expired') && (
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_IN')}
                  className={`py-1.5 rounded-lg transition-all ${
                    authTab === 'SIGN_IN' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_UP')}
                  className={`py-1.5 rounded-lg transition-all ${
                    authTab === 'SIGN_UP' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Alert Messages */}
            {userError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{userError}</span>
              </div>
            )}

            {userSaved && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Profile saved! Ready for instant ordering.</span>
              </div>
            )}

            {/* Customer Sign In / Sign Up Form */}
            {(authTab === 'SIGN_IN' || authTab === 'SIGN_UP') && (
              <form onSubmit={handleUserAuth} className="space-y-3.5 text-left text-xs font-semibold">
                
                {authTab === 'SIGN_UP' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        FULL NAME
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        MOBILE NUMBER
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="raj@gmail.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      PASSWORD
                    </label>
                    {authTab === 'SIGN_IN' && (
                      <Link
                        href="/account"
                        onClick={() => setIsAuthModalOpen(false)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#067a46] hover:bg-[#046137] text-white font-black text-sm shadow-md shadow-emerald-700/20 transition-all mt-2"
                >
                  {authTab === 'SIGN_IN' ? 'Sign In' : 'Create Account & Sign In'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
};
