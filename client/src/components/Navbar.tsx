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
  LogOut
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { AuthService } from '@/services/api';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { cartItems, setIsCartOpen, customerName, setCustomerProfile, logoutCustomer, loadSavedProfile } = useCartStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP' | 'ADMIN'>('SIGN_IN');

  // Customer Form State
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userSaved, setUserSaved] = useState(false);
  const [userError, setUserError] = useState('');

  // Admin State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@yazhisai.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Mark as mounted after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
    loadSavedProfile();
  }, [loadSavedProfile]);

  // Strict & Robust Admin Access Detection & Cookie Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedJwt = localStorage.getItem('yazhisai_admin_jwt');

      // Clean up legacy dummy tokens if present
      if (storedJwt === 'demo_admin_jwt_session') {
        localStorage.removeItem('yazhisai_admin_jwt');
        localStorage.removeItem('yazhisai_admin_active');
      }

      const activeToken = (storedJwt && storedJwt !== 'demo_admin_jwt_session') ? storedJwt : null;
      const hasCookieToken = document.cookie.includes('admin_token=') || document.cookie.includes('yazhisai_admin_jwt=') || document.cookie.includes('yazhisai_admin_token=');

      // 1. Re-sync cookie from localStorage if cookie is missing
      if (activeToken && !hasCookieToken) {
        document.cookie = `admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_jwt=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      // 2. Strict verification: Admin is ONLY true when a real server JWT token exists
      const isAdmin = Boolean(activeToken);
      setIsAdminLoggedIn(isAdmin);
    }
  }, [pathname]);

  // Customer Routes
  const customerRoutes = [
    { href: '/', label: 'Storefront', icon: UtensilsCrossed },
    { href: '/orders', label: 'My Orders', icon: PackageCheck },
    { href: '/account', label: 'Account', icon: User },
  ];

  // Admin Routes (Shown when Admin authenticated or visiting admin pages)
  const adminRoutes = [
    { href: '/', label: 'Storefront', icon: UtensilsCrossed },
    { href: '/admin/schedule', label: 'Slot Control', icon: Calendar },
    { href: '/admin/orders', label: 'Live Orders', icon: Layers },
    { href: '/admin/kot', label: 'KOT Screen', icon: ClipboardList },
    { href: '/admin/menu', label: 'Menu Catalog', icon: ChefHat },
  ];

  const routes = isAdminLoggedIn ? adminRoutes : customerRoutes;

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yazhisai_admin_jwt');
      localStorage.removeItem('yazhisai_admin_active');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'yazhisai_admin_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'yazhisai_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    logoutCustomer();
    setIsAdminLoggedIn(false);
    router.push('/admin/login');
  };

  const handleUserAuth = (e: React.FormEvent) => {
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

    if (!userPassword || userPassword.length < 6) {
      setUserError('Password must be at least 6 characters.');
      return;
    }

    const savedName = fullName || userEmail.split('@')[0];
    const savedPhone = userPhone || '9876543210';
    setCustomerProfile(savedName, savedPhone);

    setUserSaved(true);
    setTimeout(() => {
      setIsAuthModalOpen(false);
      setUserSaved(false);
      router.push('/');
    }, 800);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      const res = await AuthService.login({ email: adminEmail, password: adminPassword });
      if (!res || !res.token) {
        throw new Error('Invalid admin email or password');
      }

      const activeToken = res.token;

      if (typeof window !== 'undefined') {
        localStorage.setItem('yazhisai_admin_jwt', activeToken);
        localStorage.setItem('yazhisai_admin_active', 'true');
        document.cookie = `admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_jwt=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      setIsAdminLoggedIn(true);
      setAdminLoading(false);
      setIsAuthModalOpen(false);
      router.push('/admin/schedule');
    } catch (err: any) {
      setAdminLoading(false);
      setAdminError(err.message || 'Invalid admin credentials');
    }
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
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href;

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white font-black shadow-sm'
                        : 'hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{route.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Buttons: Admin Indicator, Auth Trigger & Tray Cart Button */}
            <div className="flex items-center space-x-3">
              
              {/* Admin Portal Badge & Direct Link */}
              {mounted && isAdminLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/schedule"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>👨‍🍳 Chef Admin Matrix</span>
                  </Link>
                  <button
                    onClick={handleAdminLogout}
                    title="Logout Admin Session"
                    className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Customer Account / Sign In Link */
                <Link
                  href="/account"
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 shadow-sm transition-all"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">
                    {mounted && customerName ? `Vanakkam, ${customerName.split(' ')[0]}` : 'Sign In / Account'}
                  </span>
                </Link>
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
                {authTab === 'ADMIN'
                  ? 'Chef Admin Portal'
                  : authTab === 'SIGN_IN'
                  ? 'Welcome Back'
                  : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {authTab === 'ADMIN'
                  ? 'Sign in to access kitchen command matrix'
                  : authTab === 'SIGN_IN'
                  ? 'Sign in to manage addresses and orders'
                  : 'Create an account for instant ordering'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-extrabold">
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
              <button
                type="button"
                onClick={() => setAuthTab('ADMIN')}
                className={`py-1.5 rounded-lg transition-all ${
                  authTab === 'ADMIN' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600'
                }`}
              >
                👨‍🍳 Admin
              </button>
            </div>

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
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    PASSWORD
                  </label>
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

            {/* Admin Login Form */}
            {authTab === 'ADMIN' && (
              <form onSubmit={handleAdminLogin} className="space-y-3.5 text-left text-xs font-semibold">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-xs">
                  <div className="font-extrabold text-emerald-950">Demo Admin Quick Login:</div>
                  <div>Email: <span className="font-mono font-bold text-emerald-700">admin@yazhisai.com</span></div>
                  <div>Password: <span className="font-mono font-bold text-emerald-700">admin123</span></div>
                </div>

                {adminError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                    {adminError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    ADMIN EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  <span>{adminLoading ? 'Authenticating...' : 'Sign In as Chef Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
};
