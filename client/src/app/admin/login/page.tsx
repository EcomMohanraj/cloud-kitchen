'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthService } from '@/services/api';
import { useCartStore } from '@/store/cartStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setCustomerProfile } = useCartStore();

  const [email, setEmail] = useState('');
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
      // 1. Authenticate against Express backend Admin table
      const res = await AuthService.login({ email, password });
      if (!res || !res.token) {
        throw new Error('Invalid email or password credentials');
      }

      const activeToken = res.token;

      // 2. Set Admin Auth JWT Token in LocalStorage & Cookies
      if (typeof window !== 'undefined') {
        localStorage.setItem('yazhisai_admin_jwt', activeToken);
        localStorage.setItem('yazhisai_admin_active', 'true');
        document.cookie = `admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_jwt=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `yazhisai_admin_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      setSuccess(true);

      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/admin/schedule';
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
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
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">Chef & Admin Portal</h1>
          <p className="text-xs text-emerald-800 font-extrabold tracking-wide">
            Yazhisai Cloud Kitchen Management Console
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

      </div>
    </div>
  );
}
