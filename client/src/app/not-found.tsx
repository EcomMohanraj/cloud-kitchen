import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
        <UtensilsCrossed className="w-10 h-10 text-emerald-400" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 font-medium">
        Oops! The gourmet dish or kitchen route you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home Menu
      </Link>
    </div>
  );
}
