'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Volume2, VolumeX, Bell, CheckCircle2, ShieldAlert, ShoppingBag, MapPin, User, Phone, Clock, UtensilsCrossed } from 'lucide-react';

export interface OrderAlertNotifierRef {
  triggerAlert: (order: any) => void;
  stopAlert: () => void;
}

interface OrderAlertNotifierProps {
  onAcknowledge?: (order: any) => void;
}

export const OrderAlertNotifier = forwardRef<OrderAlertNotifierRef, OrderAlertNotifierProps>((props, ref) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeAlertOrder, setActiveAlertOrder] = useState<any | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load sound alert preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yazhisai_admin_sound_alert');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yazhisai_admin_sound_alert', String(nextState));
    }
    unlockAudio();
  };

  const unlockAudio = () => {
    try {
      if (!audioContextRef.current && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playSynthesizedChime = () => {
    try {
      unlockAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;

      // Dual-tone chime (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  };

  const startSoundLoop = () => {
    if (!soundEnabled) return;

    // 1. Try HTMLAudioElement with order-bell.mp3
    try {
      if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new Audio('/sounds/order-bell.mp3');
        audioRef.current.loop = true;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Fallback handled by Web Audio API synth
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Synthesized bell chime loop
    playSynthesizedChime();
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    synthTimerRef.current = setInterval(playSynthesizedChime, 1500);

    // 3. Auto-stop after 30 seconds if not acknowledged
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = setTimeout(() => {
      stopSoundLoop();
    }, 30000);
  };

  const stopSoundLoop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const handleAcknowledge = () => {
    stopSoundLoop();
    if (props.onAcknowledge && activeAlertOrder) {
      props.onAcknowledge(activeAlertOrder);
    }
    setActiveAlertOrder(null);
  };

  useImperativeHandle(ref, () => ({
    triggerAlert: (order: any) => {
      setActiveAlertOrder(order);
      startSoundLoop();
    },
    stopAlert: () => {
      stopSoundLoop();
      setActiveAlertOrder(null);
    },
  }));

  useEffect(() => {
    return () => {
      stopSoundLoop();
    };
  }, []);

  return (
    <>
      {/* Sound Toggle Control Button */}
      <button
        onClick={toggleSound}
        type="button"
        title={soundEnabled ? 'Disable order notification sound' : 'Enable order notification sound'}
        className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center space-x-2 transition-all border shadow-sm ${
          soundEnabled
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
        }`}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>🔔 Sound Alerts: ON</span>
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4 text-slate-400" />
            <span>🔕 Sound Alerts: OFF</span>
          </>
        )}
      </button>

      {/* Full-Screen Acknowledgment Modal */}
      {activeAlertOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border-2 border-amber-400 rounded-3xl shadow-2xl overflow-hidden text-slate-900 space-y-6 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            
            {/* Top Glowing Alert Bar */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-4 text-slate-950 flex items-center justify-between font-black text-sm tracking-wide shadow-md">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-5 h-5 animate-bounce text-slate-950" />
                <span>🚨 NEW LIVE ORDER RECEIVED!</span>
              </div>
              <span className="text-[10px] bg-slate-950 text-amber-400 px-2.5 py-1 rounded-full font-mono font-bold">
                Auto-stop in 30s
              </span>
            </div>

            {/* Order Brief Info */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Order Number</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    #{activeAlertOrder.orderNumber || activeAlertOrder.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₹{activeAlertOrder.totalAmount || activeAlertOrder.subtotal || 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer</span>
                  </div>
                  <p className="font-extrabold text-slate-900">{activeAlertOrder.customerName}</p>
                  <p className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {activeAlertOrder.customerPhone}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Slot & Delivery</span>
                  </div>
                  <p className="font-black text-emerald-800 uppercase tracking-wider">
                    {activeAlertOrder.slotType || 'BREAKFAST'}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium truncate">
                    {activeAlertOrder.bookingDate || 'Today'}
                  </p>
                </div>

                <div className="col-span-2 space-y-1 border-t border-slate-200/60 pt-2.5 mt-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                    {activeAlertOrder.deliveryAddress}
                  </p>
                </div>
              </div>

              {/* Items Summary */}
              {activeAlertOrder.items && activeAlertOrder.items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Order Items ({activeAlertOrder.items.length})
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-slate-700 pr-1">
                    {activeAlertOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 font-semibold">
                        <span>{item.quantity}x {item.menuItemName || item.name}</span>
                        <span className="font-extrabold text-slate-900">₹{item.totalPrice || item.unitPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acknowledge Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAcknowledge}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all duration-200 active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>ACKNOWLEDGE & STOP SOUND</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
});

OrderAlertNotifier.displayName = 'OrderAlertNotifier';
