'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Heart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setCustomerProfile } = useCartStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('தயவுசெய்து உங்கள் பெயரை உள்ளிடவும் (Full Name required).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMsg('தயவுசெய்து செல்லுபடியாகும் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (10-digit phone number required).');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('தயவுசெய்து சரியான மின்னஞ்சலை உள்ளிடவும் (Valid email required).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும் (Password must be at least 6 characters).');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCustomerProfile(fullName, phone);
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/menu');
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      
      {/* Centered Minimal Auth Card (Max-width ~420px) */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-3xl shadow-xl p-7 sm:p-9 space-y-6 text-center relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-6 h-6" />
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="text-sm font-semibold text-emerald-800 tracking-wide mt-0.5">
              புதிய கணக்கு உருவாக்கு
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Join Yazhisai Cloud Kitchen for instant gourmet pre-ordering
            </p>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-left text-xs font-semibold">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              FULL NAME (உங்கள் பெயர்) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. Anandan Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              PHONE NUMBER (கைப்பேசி எண்) *
            </label>
            <div className="flex items-center space-x-2">
              <span className="px-3.5 py-3 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-700">
                +91
              </span>
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              EMAIL ADDRESS (மின்னஞ்சல்) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="gourmet@yazhisai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              PASSWORD (கடவுச்சொல்) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* BELOW FORM LINK */}
        <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 space-y-2">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-extrabold hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>

        {/* TRUST MICROCOPY ROW */}
        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 font-bold flex items-center justify-around gap-1 text-center">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Home Cooked</span>
          </div>
          <div className="flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Preservatives</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Hygiene Certified</span>
          </div>
        </div>

      </div>

    </div>
  );
}
