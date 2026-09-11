'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ShieldCheck, HeartHandshake, MapPin, Phone, Mail, Clock, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg text-white tracking-tight">
                  Yazhisai <span className="text-emerald-400 font-bold">Cloud Kitchen</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  யாழிசை மனையக உணவகம்
                </span>
              </div>
            </Link>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Authentic South Indian home-cooked meals prepared in small batch sessions using 100% natural ingredients, hand-ground spices, and cold-pressed oils.
            </p>

            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>FSSAI Hygiene Certified Kitchen</span>
            </div>
          </div>

          {/* Quick Order Links */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Kitchen Sessions</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-emerald-400 transition-colors">
                <span className="font-bold text-slate-200">Morning Tiffin:</span> 07:00 AM – 10:00 AM
              </li>
              <li className="hover:text-emerald-400 transition-colors">
                <span className="font-bold text-slate-200">Traditional Lunch:</span> 12:00 PM – 03:00 PM
              </li>
              <li className="hover:text-emerald-400 transition-colors">
                <span className="font-bold text-slate-200">Evening Snacks:</span> 04:30 PM – 06:30 PM
              </li>
              <li className="hover:text-emerald-400 transition-colors">
                <span className="font-bold text-slate-200">Special Dinner:</span> 07:30 PM – 10:00 PM
              </li>
            </ul>
          </div>

          {/* Guarantee Badges */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Our Promises</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Zero Added Preservatives or Colors</span>
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Crafted Fresh Per Slot Session</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Standardized Temperature Delivery</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Kitchen & Contact</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Chef Yazhisai Home Kitchen, Anna Nagar West, Chennai, Tamil Nadu - 600040</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 82485 51225</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>orders@yazhisaikitchen.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Yazhisai Cloud Kitchen. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <span className="text-rose-500">❤️</span>
            <span>for authentic food lovers</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
