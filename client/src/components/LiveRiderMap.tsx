'use client';

import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Navigation, Phone, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { RiderService } from '@/services/api';
import { getSocket } from '@/services/socket';

interface LiveRiderMapProps {
  orderId: string;
  orderStatus: string;
  deliveryAddress: string;
  deliveryPartner?: { name?: string; phone?: string } | null;
}

interface RiderLocationData {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export const LiveRiderMap: React.FC<LiveRiderMapProps> = ({
  orderId,
  orderStatus,
  deliveryAddress,
  deliveryPartner,
}) => {
  const [riderLocation, setRiderLocation] = useState<RiderLocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (orderStatus !== 'OUT_FOR_DELIVERY' && orderStatus !== 'DELIVERED') {
      setLoadingLocation(false);
      return;
    }

    // 1. REST Fallback for initial location load
    const fetchInitialLocation = async () => {
      try {
        const res = await RiderService.getRiderLocation(orderId);
        if (res && res.location) {
          setRiderLocation({
            latitude: res.location.latitude,
            longitude: res.location.longitude,
            updatedAt: res.location.updatedAt,
          });
        }
      } catch (err) {
        console.warn('REST fallback for rider location error:', err);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchInitialLocation();

    // 2. Listen for Real-Time Socket GPS updates & socket reconnection
    const socket = getSocket();
    const handleLocationUpdate = (data: any) => {
      if (data && (data.orderId === orderId || !data.orderId)) {
        console.log('⚡ [LiveRiderMap] Realtime rider location update:', data);
        setRiderLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    };

    const handleConnect = () => {
      console.log('⚡ [LiveRiderMap] Socket reconnected, re-fetching latest rider location');
      fetchInitialLocation();
    };

    socket.on('connect', handleConnect);
    socket.on('rider-location-update', handleLocationUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('rider-location-update', handleLocationUpdate);
    };
  }, [orderId, orderStatus]);

  if (orderStatus !== 'OUT_FOR_DELIVERY' && orderStatus !== 'DELIVERED') {
    return null;
  }

  // Delivered Success Screen
  if (orderStatus === 'DELIVERED') {
    return (
      <div className="bg-emerald-950/90 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl text-white space-y-3 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black">Order Delivered Successfully 🎉</h3>
        <p className="text-xs text-emerald-200 font-semibold max-w-md mx-auto">
          Thank you for ordering with Yazhisai Cloud Kitchen! Enjoy your delicious meal.
        </p>
      </div>
    );
  }

  // Calculate friendly customer status based on rider GPS coordinates
  const getFriendlyStatus = (lat: number, lng: number) => {
    const kitchenLat = 13.0827;
    const kitchenLng = 80.2707;
    const R = 6371; // Earth radius in km
    const dLat = ((lat - kitchenLat) * Math.PI) / 180;
    const dLng = ((lng - kitchenLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((kitchenLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    // Log raw coordinates for internal developer debugging
    console.log('⚡ [LiveRiderMap Internal Log] Rider GPS:', { latitude: lat, longitude: lng, distKm: distKm.toFixed(1) });

    if (distKm < 2.0) {
      return {
        title: 'Your rider is nearby 🛵',
        subtitle: 'Arriving very soon at your delivery address!',
        badge: 'Nearby',
      };
    } else {
      return {
        title: 'Your rider is on the way 🛵',
        subtitle: 'In transit with your freshly cooked hot meal.',
        badge: 'On The Way',
      };
    }
  };

  const statusInfo = riderLocation ? getFriendlyStatus(riderLocation.latitude, riderLocation.longitude) : null;

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-white space-y-5 overflow-hidden relative">
      {/* Glow background accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Live Delivery Tracker 🛵</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time updates from kitchen dispatch to your doorstep</p>
          </div>
        </div>

        {deliveryPartner && (
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
            <Truck className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold text-[10px]">Assigned Rider</span>
              <span className="font-bold text-white">{deliveryPartner.name}</span>
            </div>
            {deliveryPartner.phone && (
              <a
                href={`tel:${deliveryPartner.phone}`}
                className="ml-2 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                title="Call Rider"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* MAP / FRIENDLY STATUS DISPLAY */}
      {loadingLocation ? (
        <div className="py-10 text-center space-y-2">
          <Clock className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Connecting to rider live stream...</p>
        </div>
      ) : apiKey ? (
        /* GOOGLE MAPS DISPLAY IF API KEY IS PRESENT */
        <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-700 shadow-inner relative">
          <iframe
            title="Live Rider Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={
              riderLocation
                ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${riderLocation.latitude},${riderLocation.longitude}`
                : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(deliveryAddress)}`
            }
            allowFullScreen
          ></iframe>
        </div>
      ) : riderLocation && statusInfo ? (
        /* CLEAN CUSTOMER-FRIENDLY PROGRESS PANEL */
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">{statusInfo.title}</h4>
                <p className="text-xs text-emerald-200 mt-0.5 font-medium">{statusInfo.subtitle}</p>
              </div>
            </div>
            <span className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              {statusInfo.badge}
            </span>
          </div>

          {deliveryPartner && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm">
                  {deliveryPartner.name ? deliveryPartner.name.charAt(0).toUpperCase() : 'R'}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Delivery Partner</span>
                  <span className="text-sm font-bold text-white">{deliveryPartner.name || 'Kitchen Partner'}</span>
                </div>
              </div>

              {deliveryPartner.phone && (
                <a
                  href={`tel:${deliveryPartner.phone}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider ({deliveryPartner.phone})</span>
                </a>
              )}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Live order updates active. Prepared fresh with high hygiene standards.</span>
          </div>
        </div>
      ) : (
        /* FRIENDLY RIDER DISPATCH FALLBACK */
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">Your rider is on the way 🛵</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-medium">
              Order dispatched with {deliveryPartner?.name || 'our delivery partner'}. Live tracking stream will refine automatically as your rider approaches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
