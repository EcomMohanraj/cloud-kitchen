'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, CheckCircle2, AlertCircle, Loader2, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import { SettingsService } from '@/services/api';

export default function AdminSettingsPage() {
  const router = useRouter();

  const [deliveryFee, setDeliveryFee] = useState<number>(40);
  const [enableDeliveryFee, setEnableDeliveryFee] = useState<boolean>(true);
  const [packingFee, setPackingFee] = useState<number>(15);
  const [enablePackingFee, setEnablePackingFee] = useState<boolean>(true);
  const [minOrderValue, setMinOrderValue] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await SettingsService.getStoreSettings();
      if (res) {
        if (res.defaultDeliveryFee !== undefined) setDeliveryFee(res.defaultDeliveryFee);
        if (res.enableDeliveryFee !== undefined) setEnableDeliveryFee(res.enableDeliveryFee);
        if (res.defaultPackingFee !== undefined) setPackingFee(res.defaultPackingFee);
        if (res.enablePackingFee !== undefined) setEnablePackingFee(res.enablePackingFee);
        if (res.minOrderValue !== undefined) setMinOrderValue(res.minOrderValue);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setErrorMsg(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await SettingsService.updateStoreSettings({
        defaultDeliveryFee: Number(deliveryFee),
        enableDeliveryFee,
        defaultPackingFee: Number(packingFee),
        enablePackingFee,
        minOrderValue: Number(minOrderValue),
      });
      if (res) {
        setSuccessMsg('Store settings updated successfully!');
        if (res.defaultDeliveryFee !== undefined) setDeliveryFee(res.defaultDeliveryFee);
        if (res.enableDeliveryFee !== undefined) setEnableDeliveryFee(res.enableDeliveryFee);
        if (res.defaultPackingFee !== undefined) setPackingFee(res.defaultPackingFee);
        if (res.enablePackingFee !== undefined) setEnablePackingFee(res.enablePackingFee);
        if (res.minOrderValue !== undefined) setMinOrderValue(res.minOrderValue);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-card-soft">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-600/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              Kitchen & Store Settings
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Configure delivery fees, packing charges, minimum order rules, and store toggles
            </p>
          </div>
        </div>
      </div>

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
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Delivery Fee Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Delivery Fee</h2>
                    <p className="text-xs text-slate-500 font-medium">Base charge for delivery</p>
                  </div>
                </div>

                {/* Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDeliveryFee}
                    onChange={(e) => setEnableDeliveryFee(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {enableDeliveryFee ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Delivery Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!enableDeliveryFee}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-40"
                    placeholder="40"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5">
                  {enableDeliveryFee
                    ? 'Orders under ₹500 will charge this fee. Orders > ₹500 get free delivery.'
                    : 'Delivery charge disabled — ₹0 will be charged for all orders.'}
                </p>
              </div>
            </div>

            {/* 2. Packing Fee Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Packaging Charge</h2>
                    <p className="text-xs text-slate-500 font-medium">Standard packaging fee</p>
                  </div>
                </div>

                {/* Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePackingFee}
                    onChange={(e) => setEnablePackingFee(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {enablePackingFee ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard Packing Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!enablePackingFee}
                    value={packingFee}
                    onChange={(e) => setPackingFee(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-40"
                    placeholder="15"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5">
                  {enablePackingFee
                    ? 'Standard packaging charge applied to all orders at checkout.'
                    : 'Packaging charge disabled — ₹0 will be charged at checkout.'}
                </p>
              </div>
            </div>

            {/* 3. Minimum Order Value Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 lg:col-span-2">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Minimum Order Value</h2>
                  <p className="text-xs text-slate-500 font-medium">Minimum item subtotal required for checkout</p>
                </div>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Minimum Order Subtotal (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600"
                    placeholder="100"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5">
                  Orders with an item subtotal below ₹{minOrderValue} will be blocked at checkout and rejected by the server. Set to 0 to disable.
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
