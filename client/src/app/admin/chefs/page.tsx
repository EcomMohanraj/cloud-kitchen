'use client';

import React, { useEffect, useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import {
  ChefHat,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldAlert,
  Clock,
  X,
  Menu,
  Package,
  UtensilsCrossed,
} from 'lucide-react';

import { AdminChefService } from '@/services/api';

export default function AdminChefsPage() {
  const router = useRouter();


  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add Chef Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChefName, setNewChefName] = useState('');
  const [newChefPhone, setNewChefPhone] = useState('');
  const [newChefPassword, setNewChefPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Chef Order History Modal State
  const [selectedChef, setSelectedChef] = useState<any | null>(null);
  const [chefOrders, setChefOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [modalPreset, setModalPreset] = useState<'all' | 'today' | '7days' | 'custom'>('all');
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');

  const fetchChefOrdersWithFilter = useCallback(async (chefId: string, start?: string, end?: string) => {
    setOrdersLoading(true);
    setChefOrders([]);
    try {
      const res = await AdminChefService.getChefOrders(chefId, start, end);
      if (res && res.success) {
        setChefOrders(res.orders || []);
      }
    } catch (err: any) {
      console.error('Failed to load chef orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const handleViewChefOrders = (chef: any) => {
    setSelectedChef(chef);
    setModalPreset('all');
    setModalStartDate('');
    setModalEndDate('');
    fetchChefOrdersWithFilter(chef.id);
  };

  const handleChefPresetSelect = (preset: 'all' | 'today' | '7days') => {
    setModalPreset(preset);
    if (!selectedChef) return;

    if (preset === 'all') {
      setModalStartDate('');
      setModalEndDate('');
      fetchChefOrdersWithFilter(selectedChef.id);
    } else {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let startStr = todayStr;

      if (preset === '7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 6);
        startStr = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;
      }

      setModalStartDate(startStr);
      setModalEndDate(todayStr);
      fetchChefOrdersWithFilter(selectedChef.id, startStr, todayStr);
    }
  };

  const handleChefCustomDateChange = (type: 'start' | 'end', val: string) => {
    setModalPreset('custom');
    const newStart = type === 'start' ? val : modalStartDate;
    const newEnd = type === 'end' ? val : modalEndDate;

    if (type === 'start') setModalStartDate(val);
    else setModalEndDate(val);

    if (selectedChef && (newStart || newEnd)) {
      fetchChefOrdersWithFilter(selectedChef.id, newStart, newEnd);
    }
  };

  // Fetch all chefs
  const fetchChefs = useCallback(async () => {
    setError('');
    try {
      const res = await AdminChefService.getAllChefs();
      if (res && res.success) {
        setChefs(res.chefs || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch chefs:', err);
      setError(err.message || 'Failed to load kitchen chefs. Please ensure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (selectedChef) setSelectedChef(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddModalOpen, selectedChef]);

  // Create Chef Submit
  const handleCreateChef = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newChefName.trim() || !newChefPhone.trim() || !newChefPassword) {
      setCreateError('Please fill out all fields.');
      return;
    }

    if (newChefPassword.length < 4) {
      setCreateError('Password must be at least 4 characters long.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await AdminChefService.createChef({
        name: newChefName.trim(),
        phone: newChefPhone.trim(),
        password: newChefPassword,
      });

      if (res.success) {
        setSuccessMsg(`Chef "${res.chef.name}" created successfully!`);
        setIsAddModalOpen(false);
        setNewChefName('');
        setNewChefPhone('');
        setNewChefPassword('');
        await fetchChefs();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create chef account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Toggle Deactivate / Reactivate
  const handleToggleStatus = async (chef: any) => {
    setActionLoadingId(chef.id);
    setError('');
    setSuccessMsg('');
    try {
      const newStatus = !chef.isActive;
      const res = await AdminChefService.updateChefStatus(chef.id, newStatus);
      if (res.success) {
        setSuccessMsg(
          `Chef ${chef.name} is now ${newStatus ? 'RE-ACTIVATED' : 'DEACTIVATED'}.`
        );
        await fetchChefs();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update chef active status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter chefs by search query
  const filteredChefs = chefs.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalChefCount = chefs.length;
  const activeCount = chefs.filter((c) => c.isActive).length;
  const deactivatedCount = chefs.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-card-soft">
        <div className="flex items-center space-x-3">

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center border border-amber-600/20">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  Kitchen Chefs Console
                </h1>
                <p className="text-xs text-slate-500 font-semibold">
                  Manage kitchen chef accounts, active access & real-time enforcement
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchChefs}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-extrabold flex items-center gap-1.5 transition-all"
              title="Refresh Chef Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Chefs</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Chef Account</span>
            </button>
          </div>
        </div>
          
          {/* Notifications */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-bold shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Kitchen Chefs</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalChefCount}</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{activeCount} Active / Authorized</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Active Status</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{activeCount}</h3>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Authorized for live fulfillment</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-rose-600 tracking-wider">Deactivated</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{deactivatedCount}</h3>
                <p className="text-[11px] text-rose-700 font-bold mt-0.5">Access disabled in real-time</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chef by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">
              Showing {filteredChefs.length} of {chefs.length} chefs
            </span>
          </div>

          {/* Chef Roster Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">Loading chef accounts...</p>
              </div>
            ) : filteredChefs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ChefHat className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Chefs Found</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery ? 'No chef matches your search query.' : 'Click "+ Add Chef Account" to create your first kitchen chef credential.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-black text-slate-500 tracking-wider">
                      <th className="py-3.5 px-6">Kitchen Chef</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredChefs.map((chef) => {
                      const isActionLoading = actionLoadingId === chef.id;
                      const isDeactivated = !chef.isActive;

                      return (
                        <tr key={chef.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Name & ID */}
                          <td className="py-4 px-6">
                            <div className="font-black text-slate-900 text-sm">{chef.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {chef.id.slice(0, 8)}...</span>
                          </td>

                          {/* Phone */}
                          <td className="py-4 px-4 font-bold text-slate-700">
                            <a
                              href={`tel:${chef.phone}`}
                              className="inline-flex items-center gap-1 hover:text-amber-700"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{chef.phone}</span>
                            </a>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            {isDeactivated ? (
                              <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" /> Deactivated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active Chef
                              </span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-4 font-semibold text-slate-600">
                            {new Date(chef.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => handleViewChefOrders(chef)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold transition-all cursor-pointer"
                            >
                              Orders
                            </button>

                            <button
                              onClick={() => handleToggleStatus(chef)}
                              disabled={isActionLoading}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                                isDeactivated
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {isActionLoading
                                ? 'Updating...'
                                : isDeactivated
                                ? 'Reactivate Chef'
                                : 'Deactivate Chef'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
    {/* CREATE CHEF MODAL */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Kitchen Chef Account</h3>
                  <p className="text-xs text-slate-500">Create new chef login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateChef} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Chef Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chef Murugan"
                  value={newChefName}
                  onChange={(e) => setNewChefName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone (10 digits)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newChefPhone}
                  onChange={(e) => setNewChefPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 4 characters"
                  value={newChefPassword}
                  onChange={(e) => setNewChefPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Chef'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHEF ORDER HISTORY MODAL */}
      {selectedChef && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedChef(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-5 relative cursor-default"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedChef.name}'s Preparation History</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Phone: {selectedChef.phone} | Status: <strong className="text-slate-700">{selectedChef.isActive ? 'Active' : 'Deactivated'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChef(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Filter Bar */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Presets */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleChefPresetSelect('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      modalPreset === 'all'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChefPresetSelect('today')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      modalPreset === 'today'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChefPresetSelect('7days')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      modalPreset === '7days'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Last 7 Days
                  </button>
                </div>

                {/* Summary Count Badge */}
                <span className="text-xs font-extrabold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
                  🍳 {chefOrders.length} order{chefOrders.length === 1 ? '' : 's'} prepared in range
                </span>
              </div>

              {/* Custom Date Inputs */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={modalStartDate}
                    onChange={(e) => handleChefCustomDateChange('start', e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold bg-white text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => handleChefCustomDateChange('end', e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Orders Body List */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
              {ordersLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                  <p className="font-bold text-slate-700">Fetching order history...</p>
                </div>
              ) : chefOrders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">No orders prepared yet by this chef in the selected date range.</p>
                </div>
              ) : (
                chefOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">
                          Order #{order.orderNumber || order.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {order.bookingDate} ({order.slotType})
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : order.orderStatus === 'READY_FOR_PICKUP'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Customer</span>
                        <span className="font-bold text-slate-900">{order.customerName}</span> ({order.customerPhone})
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Delivery Address</span>
                        <span className="font-semibold text-slate-800 line-clamp-2">{order.deliveryAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-slate-900 font-bold border-t border-slate-200/60">
                      <span>Items: {order.items?.map((i: any) => `${i.quantity}x ${i.menuItemName || i.name}`).join(', ')}</span>
                      <span className="text-emerald-700 text-sm font-black">₹{order.totalAmount} ({order.paymentMethod})</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-200 shrink-0 text-right">
              <button
                onClick={() => setSelectedChef(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

