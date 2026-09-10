'use client';

import React, { useState } from 'react';
import { ChefHat, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { AuthService } from '@/services/api';
import { useCartStore } from '@/store/cartStore';

export default function AdminLoginPage() {
  const { setCustomerProfile } = useCartStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Authenticate against Express backend Admin table
      const res = await AuthService.login({ email, password });

      if (res && res.requires2FA && res.tempToken) {
        setRequires2FA(true);
        setTempToken(res.tempToken);
        setLoading(false);
        return;
      }

      if (!res || (!res.success && !res.token)) {
        throw new Error('Invalid email or password credentials');
      }

      setSuccess(true);
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/admin/schedule';
      // Use hard navigation so the browser sends the httpOnly admin_token cookie
      // on the new request, allowing Next.js middleware to recognise the session.
      // router.push() does a soft client-side nav that doesn't re-send new cookies.
      window.location.href = redirectPath;
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await AuthService.loginVerify2FA(tempToken, twoFactorCode);
      if (!res || !res.success) {
        throw new Error(res.error || 'Invalid 2FA verification code');
      }

      setSuccess(true);
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/admin/schedule';
      // Hard navigation — same reason as handleLogin above.
      window.location.href = redirectPath;
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden text-slate-900">
        
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 mx-auto flex items-center justify-center shadow-md shadow-emerald-600/25">
            {requires2FA ? <ShieldCheck className="w-8 h-8 text-white" /> : <ChefHat className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
            {requires2FA ? 'Two-Factor Authentication' : 'Chef & Admin Portal'}
          </h1>
          <p className="text-xs text-emerald-800 font-extrabold tracking-wide">
            {requires2FA ? 'Enter code from your Authenticator app' : 'Yazhisai Cloud Kitchen Management Console'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Authenticated! Redirecting to Kitchen Matrix...</span>
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FAVerify} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                6-Digit Authenticator Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-black tracking-[0.3em] text-slate-900 focus:outline-none focus:border-emerald-600 text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || twoFactorCode.length !== 6}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Verifying 2FA...' : 'Verify & Complete Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTempToken('');
                setTwoFactorCode('');
                setError('');
              }}
              className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Back to Email & Password
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
