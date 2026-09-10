'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Lock, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RiderService } from '@/services/api';

export default function RiderLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await RiderService.login({ phone, password });
      if (!res || (!res.success && !res.token)) {
        throw new Error('Invalid phone number or password credentials');
      }

      if (typeof window !== 'undefined' && res.rider) {
        localStorage.setItem('rider_info', JSON.stringify(res.rider));
      }

      setSuccess(true);

      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/rider/dashboard';
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Invalid rider credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden text-slate-900">
        
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-100/60 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-md shadow-blue-600/25">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">Delivery Partner Portal</h1>
          <p className="text-xs text-blue-800 font-extrabold tracking-wide">
            Yazhisai Cloud Kitchen Fleet App
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
            <span>Authenticated! Redirecting to Rider Dashboard...</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Rider Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit phone number"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center space-x-2 transition-all"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Rider Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
