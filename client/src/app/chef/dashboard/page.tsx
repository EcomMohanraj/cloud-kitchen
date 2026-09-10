'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  PackageCheck,
  LogOut,
  UtensilsCrossed,
  User,
  Phone,
  MapPin,
  Calendar,
  Filter,
} from 'lucide-react';
import { ChefService, AuthService } from '@/services/api';
import { getSocket, joinChefRoom } from '@/services/socket';
import { ChefOrderAlertNotifier, ChefOrderAlertNotifierRef } from '@/components/chef/ChefOrderAlertNotifier';

export default function ChefDashboardPage() {
  const router = useRouter();

  const [chefInfo, setChefInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'PREPARING'>('ALL');

  const notifierRef = useRef<ChefOrderAlertNotifierRef | null>(null);

  // Fetch live chef orders from backend (Strictly excludes financial/billing details)
  const fetchLiveOrders = useCallback(async () => {
    setError('');
    try {
      const res = await ChefService.getLiveOrders();
      if (res && res.success) {
        setOrders(res.orders || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch chef live orders:', err);
      setError(err.message || 'Failed to fetch live orders. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication & setup socket room
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedInfo = localStorage.getItem('chef_info');
      if (storedInfo) {
        try {
          setChefInfo(JSON.parse(storedInfo));
        } catch (e) {}
      }
    }

    fetchLiveOrders();

    // Socket.io real-time connection setup
    const socket = getSocket();
    joinChefRoom();

    const handleNewOrder = (data: any) => {
      console.log('⚡ [Chef Dashboard] New live order received via Socket.io:', data);
      fetchLiveOrders();
      if (data?.order) {
        notifierRef.current?.triggerAlert(data.order);
      }
    };

    const handleOrderStatusUpdated = (data: any) => {
      console.log('⚡ [Chef Dashboard] Order status update received via Socket.io:', data);
      fetchLiveOrders();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new-order-for-chef', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdated);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new-order-for-chef', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdated);
    };
  }, [fetchLiveOrders, router]);

  // Action: Accept Order
  const handleAcceptOrder = async (orderId: string, orderNumber: string) => {
    setActionLoadingId(orderId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await ChefService.acceptOrder(orderId);
      if (res.success) {
        setSuccessMsg(`Order #${orderNumber} accepted successfully!`);
        await fetchLiveOrders();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Start Preparing
  const handleStartPreparing = async (orderId: string, orderNumber: string) => {
    setActionLoadingId(orderId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await ChefService.startPreparing(orderId);
      if (res.success) {
        setSuccessMsg(`Order #${orderNumber} is now PREPARING on the stove!`);
        await fetchLiveOrders();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status to PREPARING.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Ready for Pickup
  const handleReadyForPickup = async (orderId: string, orderNumber: string) => {
    setActionLoadingId(orderId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await ChefService.readyForPickup(orderId);
      if (res.success) {
        setSuccessMsg(`Order #${orderNumber} marked READY FOR PICKUP! Rider notified.`);
        await fetchLiveOrders();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status to READY FOR PICKUP.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await AuthService.logoutAdmin();
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chef_info');
    }
    router.push('/chef/login');
  };

  // Tab filtering
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'PENDING') return o.orderStatus === 'PENDING';
    if (activeTab === 'ACCEPTED') return o.orderStatus === 'ACCEPTED';
    if (activeTab === 'PREPARING') return o.orderStatus === 'PREPARING';
    return true;
  });

  const pendingCount = orders.filter((o) => o.orderStatus === 'PENDING').length;
  const acceptedCount = orders.filter((o) => o.orderStatus === 'ACCEPTED').length;
  const preparingCount = orders.filter((o) => o.orderStatus === 'PREPARING').length;

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-slate-900 flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              Chef Station Console
            </h1>
            <p className="text-xs text-orange-800 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {chefInfo ? `Chef: ${chefInfo.name} (${chefInfo.phone})` : 'Yazhisai Live Kitchen'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sound Alert Notifier */}
          <ChefOrderAlertNotifier ref={notifierRef} />

          <button
            onClick={fetchLiveOrders}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh Live Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Orders</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            title="Logout from Chef Portal"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Counter Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400'
                : 'bg-white text-slate-900 border-stone-200 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider opacity-80">Pending Acceptance</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'PENDING' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-100 text-amber-800'}`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black mt-2">{pendingCount}</h3>
            <p className="text-xs font-bold mt-1 opacity-90">Needs chef acknowledgement</p>
          </button>

          <button
            onClick={() => setActiveTab('ACCEPTED')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'ACCEPTED'
                ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-400'
                : 'bg-white text-slate-900 border-stone-200 hover:border-sky-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider opacity-80">Accepted Orders</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'ACCEPTED' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black mt-2">{acceptedCount}</h3>
            <p className="text-xs font-bold mt-1 opacity-90">Queue for preparation</p>
          </button>

          <button
            onClick={() => setActiveTab('PREPARING')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'PREPARING'
                ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-400'
                : 'bg-white text-slate-900 border-stone-200 hover:border-orange-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider opacity-80">Actively Cooking</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'PREPARING' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'}`}>
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black mt-2">{preparingCount}</h3>
            <p className="text-xs font-bold mt-1 opacity-90">Currently on the stove</p>
          </button>

        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center space-x-2">
            {(['ALL', 'PENDING', 'ACCEPTED', 'PREPARING'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                {tab === 'ALL' ? `All Live Orders (${orders.length})` : tab}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            Real-time Kitchen Dispatch Grid
          </span>
        </div>

        {/* Live Orders Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-stone-200">
            <RefreshCw className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">Loading live kitchen orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-stone-200">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Orders in Kitchen Queue</h3>
            <p className="text-xs text-slate-500 font-medium">
              {activeTab === 'ALL'
                ? 'All incoming customer orders have been prepared & sent for pickup!'
                : `No orders matching status filter "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const isActionLoading = actionLoadingId === order.id;
              const isPending = order.orderStatus === 'PENDING';
              const isAccepted = order.orderStatus === 'ACCEPTED';
              const isPreparing = order.orderStatus === 'PREPARING';

              return (
                <div
                  key={order.id}
                  className={`bg-white border-2 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all hover:shadow-md ${
                    isPending
                      ? 'border-amber-400 ring-1 ring-amber-300'
                      : isAccepted
                      ? 'border-sky-300'
                      : 'border-orange-400'
                  }`}
                >
                  {/* Card Header: Order Number & Status Badge */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Order ID</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          #{order.orderNumber || order.id}
                        </span>
                      </div>

                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] uppercase font-black px-3 py-1 rounded-full border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Pending
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-900 text-[10px] uppercase font-black px-3 py-1 rounded-full border border-sky-300">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> Accepted
                          </span>
                        )}
                        {isPreparing && (
                          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-900 text-[10px] uppercase font-black px-3 py-1 rounded-full border border-orange-300">
                            <Flame className="w-3 h-3 text-orange-600 animate-bounce" /> Preparing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta info: Slot, Date, Customer (No Pricing) */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Meal Slot</span>
                        <span className="font-extrabold text-orange-800 uppercase">{order.slotType || 'BREAKFAST'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Booking Date</span>
                        <span className="font-bold text-slate-800">{order.bookingDate || 'Today'}</span>
                      </div>
                      <div className="col-span-2 border-t border-stone-200/60 pt-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Name</span>
                        <span className="font-black text-slate-900">{order.customerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono block">{order.customerPhone}</span>
                      </div>
                    </div>

                    {/* Dish Items (Quantity + Name ONLY — NO PRICING) */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                        Items to Prepare ({order.items?.length || 0})
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-stone-50/80 px-3 py-2 rounded-xl border border-stone-200/70 font-bold text-xs"
                          >
                            <span className="text-slate-900">
                              <strong className="text-orange-600 text-sm font-black mr-2">{item.quantity}x</strong>
                              {item.menuItemName || item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* One-Click Chef Workflow Action Buttons */}
                  <div className="pt-2 border-t border-stone-100">
                    {isPending && (
                      <button
                        onClick={() => handleAcceptOrder(order.id, order.orderNumber || order.id)}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>{isActionLoading ? 'Updating...' : 'Accept Order'}</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleStartPreparing(order.id, order.orderNumber || order.id)}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                      >
                        <Flame className="w-4 h-4 text-sky-200 animate-pulse" />
                        <span>{isActionLoading ? 'Updating...' : 'Start Preparing'}</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleReadyForPickup(order.id, order.orderNumber || order.id)}
                        disabled={isActionLoading}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                      >
                        <PackageCheck className="w-4 h-4 text-emerald-200" />
                        <span>{isActionLoading ? 'Updating...' : 'Ready for Pickup'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
