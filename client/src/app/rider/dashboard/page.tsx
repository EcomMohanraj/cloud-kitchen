'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Package,
  CheckCircle2,
  MapPin,
  Phone,
  LogOut,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  User,
  Navigation,
} from 'lucide-react';
import { RiderService } from '@/services/api';
import { getSocket } from '@/services/socket';

export default function RiderDashboardPage() {
  const router = useRouter();

  const [riderInfo, setRiderInfo] = useState<{ id?: string; name?: string; phone?: string } | null>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'ACTIVE' | 'DENIED' | 'IDLE'>('IDLE');

  const watchIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // Logout helper
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rider_token');
      localStorage.removeItem('rider_info');
      document.cookie = 'rider_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/rider/login');
  };

  // Fetch all orders
  const refreshOrders = useCallback(async () => {
    setError('');
    try {
      const [availRes, myRes] = await Promise.all([
        RiderService.getAvailableOrders().catch(() => ({ orders: [] })),
        RiderService.getMyOrders().catch(() => ({ orders: [] })),
      ]);

      setAvailableOrders(availRes.orders || []);
      setMyOrders(myRes.orders || []);
    } catch (err: any) {
      console.error('Error fetching rider dashboard orders:', err);
      setError('Failed to sync orders from kitchen server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Continuous Geolocation Watch for active OUT_FOR_DELIVERY order
  useEffect(() => {
    const activeDeliveryOrder = myOrders.find((o) => o.orderStatus === 'OUT_FOR_DELIVERY');

    if (activeDeliveryOrder && typeof window !== 'undefined' && 'geolocation' in navigator) {
      if (watchIdRef.current === null) {
        console.log('📍 [Rider Dashboard] Starting live GPS watchPosition for order', activeDeliveryOrder.id);

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setLocationPermissionStatus('ACTIVE');
            const now = Date.now();
            // Throttle to 5 seconds
            if (now - lastEmitTimeRef.current >= 5000) {
              lastEmitTimeRef.current = now;
              const socket = getSocket();
              const payload = {
                deliveryPartnerId: riderInfo?.id || 'test-rider-id',
                orderId: activeDeliveryOrder.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              console.log('📍 [Rider Dashboard] Emitting rider-location-update:', payload);
              socket.emit('rider-location-update', payload);
            }
          },
          (err) => {
            console.warn('⚠️ [Rider Dashboard] Geolocation error or denied:', err.message);
            setLocationPermissionStatus('DENIED');
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );

        watchIdRef.current = watchId;
      }
    } else {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        console.log('📍 [Rider Dashboard] Clearing watchPosition');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setLocationPermissionStatus('IDLE');
      }
    }

    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [myOrders, riderInfo?.id]);

  useEffect(() => {
    // 1. Verify Rider authentication locally
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rider_token');
      const rawInfo = localStorage.getItem('rider_info');

      if (!token) {
        router.push('/rider/login');
        return;
      }

      if (rawInfo) {
        try {
          setRiderInfo(JSON.parse(rawInfo));
        } catch {
          /* ignore */
        }
      }
    }

    refreshOrders();

    // 2. Setup Socket.io real-time listeners
    const socket = getSocket();

    const handleOrderEvent = () => {
      console.log('⚡ [Rider Dashboard] Realtime order event received -> refreshing lists');
      refreshOrders();
    };

    socket.on('order-status-updated', handleOrderEvent);
    socket.on('order-assigned', handleOrderEvent);
    socket.on('new-order', handleOrderEvent);

    return () => {
      socket.off('order-status-updated', handleOrderEvent);
      socket.off('order-assigned', handleOrderEvent);
      socket.off('new-order', handleOrderEvent);
    };
  }, [refreshOrders, router]);

  // Accept Pickup
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    setError('');
    setSuccessMessage('');
    try {
      const res = await RiderService.acceptOrder(orderId);
      if (res.success) {
        setSuccessMessage(`Order #${res.order?.orderNumber || orderId} accepted successfully!`);
        await refreshOrders();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept order. It may have already been claimed.');
      await refreshOrders();
    } finally {
      setActionLoadingId(null);
    }
  };

  // Update Status (OUT_FOR_DELIVERY or DELIVERED)
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoadingId(orderId);
    setError('');
    setSuccessMessage('');
    try {
      const res = await RiderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        const label = newStatus === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'Delivered';
        setSuccessMessage(`Order #${res.order?.orderNumber || orderId} marked as ${label}!`);
        await refreshOrders();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Header Navigation */}
        <header className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Rider Command Console</h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Fleet
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Rider: <strong className="text-slate-200">{riderInfo?.name || 'Test Rider'}</strong> ({riderInfo?.phone || '9999999999'})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={refreshOrders}
              className="px-3.5 py-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 border border-slate-600/80 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Global Toast Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-3 font-semibold shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-3 font-semibold shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">Available Pickups</div>
              <div className="text-3xl font-black text-white mt-1">{availableOrders.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready at kitchen dispatch</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">My Active Delivery</div>
              <div className="text-3xl font-black text-white mt-1">{myOrders.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">In-transit or assigned to you</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* SECTION 1: MY ACTIVE DELIVERIES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <span>My Active Deliveries</span>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-extrabold">
                {myOrders.length}
              </span>
            </h2>
          </div>

          {myOrders.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No active deliveries assigned right now.</p>
              <p className="text-xs text-slate-500">Accept an order from the available list below to start delivering!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const isOutForDelivery = order.orderStatus === 'OUT_FOR_DELIVERY';
                const isActionLoading = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-800 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Assigned Order</span>
                        <h3 className="text-xl font-black text-white">{order.orderNumber || order.id}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> {order.bookingDate} | Slot: <strong className="text-slate-200">{order.slotType}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isOutForDelivery ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                        <div className="text-sm font-bold text-slate-200 mt-1">₹{order.totalAmount} ({order.paymentMethod})</div>
                      </div>
                    </div>

                    {/* Live GPS Tracking Badge */}
                    {isOutForDelivery && (
                      <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs px-3.5 py-2 rounded-xl font-bold">
                        <Navigation className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                        <span>
                          {locationPermissionStatus === 'ACTIVE'
                            ? '📍 Live GPS Location Sharing Active'
                            : locationPermissionStatus === 'DENIED'
                            ? '⚠️ Location permission denied by browser. Manual status updates active.'
                            : '📍 Initializing GPS live tracking stream...'}
                        </span>
                      </div>
                    )}

                    {/* Customer & Address Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Customer Details</div>
                        <div className="font-bold text-sm text-white">{order.customerName}</div>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-extrabold mt-1 text-xs"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Customer ({order.customerPhone})
                        </a>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Delivery Address</div>
                        <div className="flex items-start gap-1.5 text-slate-200 font-medium">
                          <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                        <div className="pt-2">
                          <a
                            href={
                              order.deliveryLatitude && order.deliveryLongitude
                                ? `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}&travelmode=driving`
                                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}&travelmode=driving`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all border border-blue-400/40"
                          >
                            <Navigation className="w-3.5 h-3.5 fill-white text-white" />
                            <span>🧭 Navigate to Customer {order.deliveryLatitude ? '(Exact GPS Pin)' : '(Text Search)'}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-400 uppercase text-[10px]">Order Contents:</div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item: any, idx: number) => (
                            <span key={idx} className="bg-slate-700/70 border border-slate-600/60 text-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                              {item.quantity}x {item.menuItemName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rider Action Buttons */}
                    <div className="pt-2">
                      {!isOutForDelivery ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                          disabled={isActionLoading}
                          className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all"
                        >
                          <Truck className="w-5 h-5" />
                          <span>{isActionLoading ? 'Updating Status...' : '1. Mark Out for Delivery'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          disabled={isActionLoading}
                          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{isActionLoading ? 'Completing Delivery...' : '2. Complete Delivery & Mark Delivered'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: AVAILABLE ORDERS FOR PICKUP */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <span>Available Orders for Pickup</span>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full font-extrabold">
                {availableOrders.length}
              </span>
            </h2>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No unclaimed orders available for pickup right now.</p>
              <p className="text-xs text-slate-500">When kitchen admin marks food ready, it will appear here instantly in real-time!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => {
                const isActionLoading = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-800 border border-slate-700 rounded-3xl p-5 space-y-4 hover:border-blue-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          READY FOR PICKUP
                        </span>
                        <span className="text-xs font-bold text-slate-400">{order.bookingDate} ({order.slotType})</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-white">{order.orderNumber || order.id}</h3>
                        <p className="text-xs font-bold text-slate-300 mt-0.5">{order.customerName}</p>
                      </div>

                      <div className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.deliveryAddress}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-slate-400">Total: <strong className="text-white">₹{order.totalAmount}</strong></span>
                        <span className="text-[11px] font-semibold text-slate-400">Payment: <strong className="text-slate-200">{order.paymentMethod}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={isActionLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all mt-2"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{isActionLoading ? 'Claiming Pickup...' : 'Accept Pickup'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
