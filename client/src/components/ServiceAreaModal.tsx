'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

interface ServiceAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceAreaModal: React.FC<ServiceAreaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
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
          {/* Header Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <MapPin className="w-8 h-8 stroke-[2.2]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
            </div>
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Service Area Announcement</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight">
              Now Serving Your Area!
            </h3>
          </div>

          {/* Message Content */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 text-slate-700 text-xs sm:text-sm font-medium leading-relaxed space-y-2">
            <p>
              We currently deliver between <span className="font-extrabold text-emerald-800 underline decoration-emerald-400 underline-offset-2">Mettupalayam</span> and <span className="font-extrabold text-emerald-800 underline decoration-emerald-400 underline-offset-2">Karamadai</span>.
            </p>
            <p className="text-[11px] text-slate-500 font-semibold italic">
              Outside this zone? We&apos;re expanding soon — check back!
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Got It</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
