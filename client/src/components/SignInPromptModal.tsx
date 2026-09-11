'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, ShieldCheck, ArrowRight, Clock, MapPin, Sparkles, X } from 'lucide-react';

interface SignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInPromptModal: React.FC<SignInPromptModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    router.push('/login');
  };

  const handleCreateAccount = () => {
    onClose();
    router.push('/register');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop - Clicking does not proceed to checkout, just closes modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
          className="relative w-full max-w-md bg-white border border-emerald-100 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 z-10 text-center space-y-5"
        >
          {/* Optional top-right dismiss button (closes modal without entering checkout) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authentication Required</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight">
              Sign In to Place Your Order
            </h3>
          </div>

          {/* Core Message */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Track your order live, save your address, and get access to exclusive meal-slot offers.
          </p>

          {/* Feature Micro-Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-bold text-slate-700">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center gap-1 text-center">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Live Order Tracking</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center gap-1 text-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Saved Addresses</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center gap-1 text-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Slot Offers</span>
            </div>
          </div>

          {/* Action Buttons: Sign In & Create Account */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSignIn}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCreateAccount}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>Create Account</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
