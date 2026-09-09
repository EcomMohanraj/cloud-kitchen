'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, CheckCircle2, AlertCircle, Loader2, Menu, Truck, ShieldCheck } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SettingsService } from '@/services/api';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [deliveryFee, setDeliveryFee] = useState<number>(40);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await SettingsService.getDeliveryFee();
      if (res && res.defaultDeliveryFee !== undefined) {
        setDeliveryFee(res.defaultDeliveryFee);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setErrorMsg(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verify admin session
    if (typeof window !== 'undefined') {
      const adminToken =
        localStorage.getItem('yazhisai_admin_jwt') ||
        document.cookie.includes('admin_token') ||
        document.cookie.includes('yazhisai_admin');

      if (!adminToken) {
        router.push('/admin/login');
        return;
      }
    }

    fetchSettings();
  }, [router]);

  const handleSaveDeliveryFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await SettingsService.updateDeliveryFee(Number(deliveryFee));
      if (res && res.success) {
        setSuccessMsg(`Default delivery fee updated to ₹${res.defaultDeliveryFee} successfully!`);
        setDeliveryFee(res.defaultDeliveryFee);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update delivery fee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-600/20">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  Kitchen & Delivery Settings
                </h1>
                <p className="text-xs text-slate-500 font-semibold">
                  Configure default delivery fees and cloud kitchen operational rules
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Body */}
        <main className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full flex-1">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-bold shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading current store settings...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Delivery Fee Configuration</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Set the base delivery charge applied to customer pre-orders under ₹500
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveDeliveryFee} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default Delivery Fee (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600"
                      placeholder="40"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5">
                    Note: Orders with item subtotal exceeding ₹500 automatically receive complimentary free delivery (₹0).
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                    <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                  </button>
                </div>
              </form>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
