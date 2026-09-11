'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { AuthService } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { setCustomerProfile } = useCartStore();

  // Mode: 'CUSTOMER_EMAIL_LOGIN' | 'ADMIN_LOGIN' | 'FORGOT_PASSWORD_EMAIL' | 'FORGOT_PASSWORD_RESET'
  const [authMode, setAuthMode] = useState<
    'CUSTOMER_EMAIL_LOGIN' | 'ADMIN_LOGIN' | 'FORGOT_PASSWORD_EMAIL' | 'FORGOT_PASSWORD_RESET'
  >('CUSTOMER_EMAIL_LOGIN');

  // Customer Email & Password State
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');

  // Admin Email & Password State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Forgot / Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts & Progress
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Customer Email + Password Sign In Handler
  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = customerEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!customerPassword) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await AuthService.loginCustomer({
        email: cleanEmail,
        password: customerPassword,
      });

      if (res.success && res.user) {
        setCustomerProfile(
          res.user.name || cleanEmail.split('@')[0],
          res.user.phone || '',
          res.user.address || ''
        );
        router.push('/');
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      console.warn('Customer Sign In error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Sign In Submit
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminEmail || !adminEmail.includes('@')) {
      setErrorMsg('Please enter a valid admin email address.');
      return;
    }

    if (!adminPassword) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const data = await AuthService.loginAdmin({ email: adminEmail, password: adminPassword });

      if (data.role === 'ADMIN') {
        router.push('/admin/orders');
      } else {
        setErrorMsg('Invalid admin credentials.');
      }
    } catch (err: any) {
      console.warn('Admin Login error:', err);
      setErrorMsg(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Send Reset OTP to Email
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await AuthService.forgotPassword({ email: cleanEmail });
      setInfoMsg(res.message || 'If an account exists with this email address, a 6-digit password reset code has been sent.');
      setAuthMode('FORGOT_PASSWORD_RESET');
    } catch (err: any) {
      console.warn('Forgot password request error:', err);
      setErrorMsg(err.message || 'Failed to process password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 2: Verify Email OTP and Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);

    try {
      const res = await AuthService.resetPassword({
        email: resetEmail.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
      });

      if (res.success) {
        setInfoMsg(res.message || 'Password reset successful! You can now log in.');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setCustomerEmail(resetEmail.trim().toLowerCase());
        setAuthMode('CUSTOMER_EMAIL_LOGIN');
      } else {
        setErrorMsg(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      console.warn('Reset password error:', err);
      setErrorMsg(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#fbf9f4]/90 backdrop-blur-md border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-full bg-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-serif font-black text-xl text-slate-900 tracking-tight">
                Yazhisai <span className="text-[#059669]">Cloud Kitchen</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-700">
              <Link href="/" className="hover:text-[#059669] transition-colors">Home</Link>
              <Link href="/" className="hover:text-[#059669] transition-colors">Menu</Link>
              <Link href="/orders" className="hover:text-[#059669] transition-colors">My Orders</Link>
            </nav>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setInfoMsg('');
                  setAuthMode(authMode === 'ADMIN_LOGIN' ? 'CUSTOMER_EMAIL_LOGIN' : 'ADMIN_LOGIN');
                }}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all border border-slate-300"
              >
                {authMode === 'ADMIN_LOGIN' ? 'Customer Sign In' : 'Admin Portal Access'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Auth Card View */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-[440px] bg-white border border-slate-200/70 rounded-[2rem] shadow-xl p-8 sm:p-10 space-y-6 text-center transition-all duration-300">
          
          <div>
            <span className="inline-block font-black text-[11px] uppercase tracking-widest text-[#059669] mb-2">
              {authMode === 'ADMIN_LOGIN'
                ? 'ADMINISTRATOR PORTAL'
                : authMode.startsWith('FORGOT_PASSWORD')
                ? 'PASSWORD RECOVERY'
                : 'CUSTOMER ACCESS'}
            </span>

            {authMode === 'CUSTOMER_EMAIL_LOGIN' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Sign in with your email & password
                </p>
              </>
            )}

            {authMode === 'ADMIN_LOGIN' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Admin Sign In
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Kitchen Command Center Dashboard Access
                </p>
              </>
            )}

            {authMode === 'FORGOT_PASSWORD_EMAIL' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Enter your registered email to receive a password reset OTP
                </p>
              </>
            )}

            {authMode === 'FORGOT_PASSWORD_RESET' && (
              <>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Enter code sent to {resetEmail} and your new password
                </p>
              </>
            )}
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold text-left">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* DEFAULT FORM: CUSTOMER EMAIL + PASSWORD SIGN IN */}
          {authMode === 'CUSTOMER_EMAIL_LOGIN' && (
            <form onSubmit={handleCustomerSignIn} className="space-y-4 text-left font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setInfoMsg('');
                      setResetEmail(customerEmail);
                      setAuthMode('FORGOT_PASSWORD_EMAIL');
                    }}
                    className="text-[11px] font-bold text-[#059669] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <span>{loading ? 'Signing In...' : 'Sign In →'}</span>
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                <span>Don't have an account?</span>
                <Link href="/register" className="ml-1.5 text-[#059669] hover:underline font-extrabold">
                  Register Here
                </Link>
              </div>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {authMode === 'ADMIN_LOGIN' && (
            <form onSubmit={handleAdminSignIn} className="space-y-4 text-left font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  ADMIN EMAIL
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="admin@yazhisai.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
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
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-[#f0f5ff] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all mt-2"
              >
                {loading ? 'Authenticating Admin...' : 'Sign In as Admin'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD STEP 1: EMAIL INPUT */}
          {authMode === 'FORGOT_PASSWORD_EMAIL' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  REGISTERED EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all mt-2"
              >
                {loading ? 'Sending Reset Code...' : 'Send Reset Code →'}
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setAuthMode('CUSTOMER_EMAIL_LOGIN');
                  }}
                  className="text-slate-500 hover:text-slate-900"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD STEP 2: VERIFY OTP & RESET PASSWORD */}
          {authMode === 'FORGOT_PASSWORD_RESET' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left font-semibold">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  6-DIGIT VERIFICATION CODE
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-black tracking-widest text-center text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f5ff] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all mt-2"
              >
                {loading ? 'Resetting Password...' : 'Reset Password & Sign In →'}
              </button>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setAuthMode('FORGOT_PASSWORD_EMAIL');
                  }}
                  className="text-slate-500 hover:text-slate-900"
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  onClick={handleForgotPasswordSubmit}
                  className="text-[#059669] hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      <footer className="border-t border-amber-900/10 py-6 text-center text-xs text-slate-500 font-semibold bg-[#fbf9f4]">
        <p>© 2026 Yazhisai Cloud Kitchen. All rights reserved.</p>
      </footer>

    </div>
  );
}
