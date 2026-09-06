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
    if (orderStatus !== 'OUT_FOR_DELIVERY') {
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

    // 2. Listen for Real-Time Socket GPS updates
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

    socket.on('rider-location-update', handleLocationUpdate);

    return () => {
      socket.off('rider-location-update', handleLocationUpdate);
    };
  }, [orderId, orderStatus]);

  if (orderStatus !== 'OUT_FOR_DELIVERY') {
    return null;
  }

  // Calculate approximate distance if location is available (using sample Chennai kitchen reference 13.0827, 80.2707)
  const calculateDistanceKm = (lat: number, lng: number) => {
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
    const dist = R * c;
    return dist < 0.5 ? 'Approaching (< 500m)' : `${dist.toFixed(1)} km away`;
  };

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
              <span>Live Rider GPS Telemetry</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time rider position tracking</p>
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

      {/* MAP / TELEMETRY DISPLAY */}
      {loadingLocation ? (
        <div className="py-10 text-center space-y-2">
          <Clock className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Connecting to rider GPS feed...</p>
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
      ) : riderLocation ? (
        /* HIGH-TECH TELEMETRY RADAR DISPLAY (FALLBACK WHEN NO GOOGLE MAPS KEY IS PROVIDED) */
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Rider Coordinates</div>
              <div className="font-mono font-bold text-xs text-emerald-400 mt-1">
                {riderLocation.latitude.toFixed(4)}° N, {riderLocation.longitude.toFixed(4)}° E
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Distance Indicator</div>
              <div className="font-bold text-xs text-amber-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{calculateDistanceKm(riderLocation.latitude, riderLocation.longitude)}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Last GPS Pulse</div>
              <div className="font-semibold text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{riderLocation.updatedAt ? new Date(riderLocation.updatedAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live tracking stream active. Your meal is on the way!</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">SOCKET OK</span>
          </div>
        </div>
      ) : (
        /* NO RIDER LOCATION YET */
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-200">Waiting for rider location stream...</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The rider has been assigned and dispatched. Live GPS markers will appear as soon as the rider device transmits coordinates.
          </p>
        </div>
      )}
    </div>
  );
};
