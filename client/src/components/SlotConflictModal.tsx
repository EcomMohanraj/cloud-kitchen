'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X, RefreshCw } from 'lucide-react';

interface SlotConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAndSwitch: () => void;
  currentSlot?: string;
  newSlot?: string;
  pendingItemName?: string;
}

export const SlotConflictModal: React.FC<SlotConflictModalProps> = ({
  isOpen,
  onClose,
  onClearAndSwitch,
  currentSlot = 'BREAKFAST',
  newSlot = 'LUNCH',
  pendingItemName = 'this dish',
}) => {
  if (!isOpen) return null;

  const currentLabel = currentSlot.charAt(0) + currentSlot.slice(1).toLowerCase();
  const newLabel = newSlot.charAt(0) + newSlot.slice(1).toLowerCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Header Warning Icon */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Different Delivery Slot</h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Single-Slot Cart Restriction
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p>
              Your cart currently contains <strong className="text-slate-900 font-black uppercase">{currentLabel}</strong> items.
            </p>
            <p>
              Adding <strong className="text-emerald-700 font-black">{pendingItemName}</strong> ({newLabel}) requires a separate checkout because each delivery slot has dedicated prep and dispatch schedules.
            </p>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => {
                onClearAndSwitch();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>Clear Cart & Add {newLabel} Item</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Keep Current {currentLabel} Cart
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
