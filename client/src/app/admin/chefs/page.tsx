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
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminChefService } from '@/services/api';

export default function AdminChefsPage() {
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    // Verify admin token
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

    fetchChefs();
  }, [fetchChefs, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddModalOpen]);

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
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          
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
        </main>
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

    </div>
  );
}
