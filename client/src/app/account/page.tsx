'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  User,
  ShoppingBag,
  Clock,
  MapPin,
  LogOut,
  ShieldCheck,
  Leaf,
  Heart,
  ChevronRight,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/store/cartStore';
import { AuthService, OrderService } from '@/services/api';

export default function AccountPage() {
  const router = useRouter();
  const { customerName, customerPhone, deliveryAddress, setCustomerProfile, logoutCustomer } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'SLOTS' | 'ADDRESSES' | 'PROFILE'>('ORDERS');

  // Auth Mode when Not Logged In: 'SIGN_IN' | 'SIGN_UP'
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && Boolean(customerName);

  useEffect(() => {
    if (isLoggedIn && customerPhone) {
      setOrdersLoading(true);
      OrderService.getOrders({ phone: customerPhone })
        .then((data) => {
          if (data && data.orders) {
            setUserOrders(data.orders);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setOrdersLoading(false));
    } else {
      setUserOrders([]);
    }
  }, [isLoggedIn, customerPhone]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.loginCustomer({ email, password });
      if (data.role === 'ADMIN' && data.token) {
        const activeToken = data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('yazhisai_admin_jwt', activeToken);
          localStorage.setItem('yazhisai_admin_active', 'true');
          document.cookie = `admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `yazhisai_admin_jwt=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `yazhisai_admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        router.push('/admin/orders');
      } else {
        const savedName = data.user?.name || email.split('@')[0];
        const savedPhone = data.user?.phone || '9876543210';
        setCustomerProfile(savedName, savedPhone, data.user?.address || '');
        router.push('/');
      }
    } catch (err: any) {
      console.warn('Backend login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.registerCustomer({ name, phone, email });
      setCustomerProfile(data.user?.name || name, data.user?.phone || phone, data.user?.address || '');
      router.push('/');
    } catch (err: any) {
      console.warn('Backend register fallback:', err);
      setCustomerProfile(name, phone);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-slate-900 font-sans flex flex-col justify-between">
      <Navbar />

      {/* VIEW 1: NOT LOGGED IN — Milkymushroom.in Style Centered Auth Card (Old 1st image format removed) */}
      {!isLoggedIn ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
          <div className="w-full max-w-[440px] bg-white border border-slate-200/70 rounded-[2rem] shadow-xl p-8 sm:p-10 space-y-6 text-center">
            
            {/* SECURE ACCESS Badge */}
            <div>
              <span className="inline-block font-black text-[11px] uppercase tracking-widest text-[#059669] mb-2">
                SECURE ACCESS
              </span>

              {authMode === 'SIGN_IN' ? (
                <>
                  <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                    Welcome Back
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Sign in to manage addresses and orders
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                    Create Account
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Join Yazhisai Cloud Kitchen to order fresh meal prep
                  </p>
                </>
              )}
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM (Image 3) */}
            {authMode === 'SIGN_IN' && (
              <form onSubmit={handleSignIn} className="space-y-4 text-left font-semibold">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="raj@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all mt-2"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center text-xs font-semibold text-slate-600">
                  <span>Don&apos;t have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setAuthMode('SIGN_UP');
                    }}
                    className="text-[#059669] font-extrabold hover:underline"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {/* CREATE ACCOUNT FORM (Image 4) */}
            {authMode === 'SIGN_UP' && (
              <form onSubmit={handleSignUp} className="space-y-4 text-left font-semibold">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="raj@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    PHONE NUMBER
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#fffdfa] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Min 4 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#fffdfa] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all mt-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center text-xs font-semibold text-slate-600">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setAuthMode('SIGN_IN');
                    }}
                    className="text-[#059669] font-extrabold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </main>
      ) : (
        /* VIEW 2: LOGGED IN ACCOUNT DASHBOARD */
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-3 border border-white/10">
                <User className="w-3.5 h-3.5 text-mint-300" />
                <span>Patron Profile</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                Vanakkam, {customerName}!
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
                வணக்கம் • உங்கள் உணவு முன்பதிவு கணக்கு நிர்வாகம்
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-rose-200 hover:text-white border border-white/20 text-xs font-extrabold transition-all self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'ORDERS', label: 'My Orders', icon: PackageCheck },
              { id: 'SLOTS', label: 'Slot Bookings', icon: Clock },
              { id: 'ADDRESSES', label: 'Addresses', icon: MapPin },
              { id: 'PROFILE', label: 'Edit Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-extrabold text-xs transition-all shrink-0 ${
                    isActive
                      ? 'border-[#059669] text-[#059669]'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            {activeTab === 'ORDERS' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Recent Food Orders</h3>
                {ordersLoading ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-500 flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
                    <span>Loading your orders...</span>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
                    <p className="text-sm font-extrabold text-slate-800">No orders placed yet</p>
                    <p className="text-xs text-slate-500 font-medium">You haven&apos;t placed any food pre-orders yet. Pick an operating date and meal slot to order!</p>
                    <Link href="/" className="inline-block px-5 py-2.5 rounded-2xl bg-[#059669] text-white text-xs font-extrabold shadow-sm">
                      Book Meal Slot
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((ord: any) => (
                      <div key={ord.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">#{ord.orderNumber || ord.id}</span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
                              {ord.orderStatus}
                            </span>
                          </div>
                          <p className="text-slate-500 font-semibold mt-1">
                            Booked for: <strong className="text-slate-800">{ord.bookingDate}</strong> ({ord.slotType} Slot) • ₹{ord.totalAmount}
                          </p>
                        </div>
                        <Link href="/orders" className="text-[#059669] font-extrabold hover:underline">
                          Track Status →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'SLOTS' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Upcoming Pre-Booked Slots</h3>
                <p className="text-xs text-slate-500 font-medium">No upcoming slot pre-orders found.</p>
                <Link href="/" className="inline-block px-5 py-2.5 rounded-2xl bg-[#059669] text-white text-xs font-extrabold">
                  Browse Kitchen Calendar
                </Link>
              </div>
            )}

            {activeTab === 'ADDRESSES' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">Saved Delivery Addresses</h3>
                {deliveryAddress ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <div className="font-bold text-slate-900">Default Delivery Address</div>
                    <p className="mt-1">{deliveryAddress}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    No delivery address recorded yet. Delivery addresses are automatically saved when you place an order.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'PROFILE' && (
              <div className="space-y-4 max-w-md text-xs font-semibold">
                <h3 className="font-extrabold text-base text-slate-900">Personal Details</h3>
                <div>
                  <label className="block text-slate-500 mb-1">Full Name</label>
                  <input type="text" readOnly value={customerName} className="w-full p-3 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Mobile Number</label>
                  <input type="text" readOnly value={customerPhone} className="w-full p-3 bg-slate-50 border rounded-xl" />
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-amber-900/10 py-6 text-center text-xs text-slate-500 font-semibold bg-[#fbf9f4]">
        <div className="flex items-center justify-center space-x-6 mb-2">
          <span>100% Home Cooked</span>
          <span>•</span>
          <span>Zero Preservatives</span>
          <span>•</span>
          <span>Hygiene Certified</span>
        </div>
        <p>© 2026 Yazhisai Cloud Kitchen. All rights reserved.</p>
      </footer>

    </div>
  );
}
