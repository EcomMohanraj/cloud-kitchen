'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useCartStore } from '@/store/cartStore';
import { AuthService } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { setCustomerProfile } = useCartStore();

  // Mode: 'SIGN_IN' | 'SIGN_UP' | 'VERIFICATION_SUCCESS'
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP' | 'VERIFICATION_SUCCESS'>('SIGN_IN');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Status Alerts
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signInEmail || !signInEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!signInPassword || signInPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await AuthService.loginCustomer({ email: signInEmail, password: signInPassword });
      
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
        const userName = data.user?.name || signInEmail.split('@')[0];
        const userPhone = data.user?.phone || '9876543210';
        setCustomerProfile(userName, userPhone, data.user?.address || '');
        router.push('/');
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit (Image 4)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signUpName || signUpName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!signUpEmail || !signUpEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!signUpPhone || !/^[6-9]\d{9}$/.test(signUpPhone.trim())) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await AuthService.registerCustomer({
        name: signUpName,
        phone: signUpPhone,
        email: signUpEmail,
      });
      setCustomerProfile(data.user?.name || signUpName, data.user?.phone || signUpPhone, data.user?.address || '');
      setMode('VERIFICATION_SUCCESS');
    } catch (err: any) {
      console.warn('Register fallback:', err);
      setCustomerProfile(signUpName, signUpPhone);
      setMode('VERIFICATION_SUCCESS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Full Top Site Header Bar (Matching milkymushroom.in style) */}
      <header className="sticky top-0 z-40 bg-[#fbf9f4]/90 backdrop-blur-md border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-full bg-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-serif font-black text-xl text-slate-900 tracking-tight">
                Yazhisai <span className="text-[#059669]">Cloud Kitchen</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-700">
              <Link href="/" className="hover:text-[#059669] transition-colors">
                Home
              </Link>
              <Link href="/" className="hover:text-[#059669] transition-colors">
                Menu
              </Link>
              <Link href="/orders" className="hover:text-[#059669] transition-colors">
                My Orders
              </Link>
              <Link href="/account" className="hover:text-[#059669] transition-colors">
                Account
              </Link>
            </nav>

            {/* Top Right Auth CTA */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setMode(mode === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN');
                }}
                className="px-5 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>{mode === 'SIGN_IN' ? 'Sign In' : 'Sign In'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Centered Auth Card View (Matching Image 3, Image 4, Image 5) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-[440px] bg-white border border-slate-200/70 rounded-[2rem] shadow-xl p-8 sm:p-10 space-y-6 text-center transition-all duration-300">
          
          {/* SECURE ACCESS Badge */}
          <div>
            <span className="inline-block font-black text-[11px] uppercase tracking-widest text-[#059669] mb-2">
              SECURE ACCESS
            </span>

            {mode === 'SIGN_IN' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Sign in to manage addresses and orders
                </p>
              </>
            )}

            {mode === 'SIGN_UP' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Create Account
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Join Yazhisai Cloud Kitchen to order fresh meal prep
                </p>
              </>
            )}

            {mode === 'VERIFICATION_SUCCESS' && (
              <div className="space-y-3 pt-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                  Simulating Verification Email
                </h1>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  Your account was created! Because this is a local test database environment, we have generated a simulated email verification link.
                </p>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN FORM (Matching Image 3) */}
          {mode === 'SIGN_IN' && (
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
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
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
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
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
                    setMode('SIGN_UP');
                  }}
                  className="text-[#059669] font-extrabold hover:underline"
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: CREATE ACCOUNT FORM (Matching Image 4) */}
          {mode === 'SIGN_UP' && (
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
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
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
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
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
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
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
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
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
                    setMode('SIGN_IN');
                  }}
                  className="text-[#059669] font-extrabold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: SIMULATING VERIFICATION EMAIL (Matching Image 5) */}
          {mode === 'VERIFICATION_SUCCESS' && (
            <div className="space-y-4 pt-2">
              <button
                onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all"
              >
                Verify Registered Account Now
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setMode('SIGN_IN')}
                  className="text-xs font-bold text-[#059669] hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Footer Links */}
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
