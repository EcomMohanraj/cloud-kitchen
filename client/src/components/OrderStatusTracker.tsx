'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Utensils, Truck, Home, AlertCircle, Phone, MapPin, Calendar, Star, Check } from 'lucide-react';

import { LiveRiderMap } from './LiveRiderMap';
import { ReviewModal } from './ReviewModal';

interface OrderStatusTrackerProps {
  order: any;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ order }) => {
  const [reviewModalItem, setReviewModalItem] = useState<any | null>(null);
  const [reviewedItemIds, setReviewedItemIds] = useState<string[]>([]);

  const isDelivered = order.orderStatus === 'DELIVERED';

  const steps = [
    { key: 'PENDING', title: 'Order Received', desc: 'Pre-order recorded in kitchen queue', icon: Clock },
    { key: 'ACCEPTED', title: 'Accepted by Chef', desc: 'Slot & ingredients allocated', icon: CheckCircle2 },
    { key: 'PREPARING', title: 'Preparing in Kitchen', desc: 'Freshly cooking on order', icon: Utensils },
    { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Delivery partner dispatched', icon: Truck },
    { key: 'DELIVERED', title: 'Delivered', desc: 'Enjoy your hot meal!', icon: Home },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PLACED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PLACED':
        return 10;
      case 'ACCEPTED':
        return 25;
      case 'PREPARING':
        return 50;
      case 'READY_FOR_PICKUP':
        return 65;
      case 'OUT_FOR_DELIVERY':
        return 80;
      case 'DELIVERED':
        return 100;
      default:
        return 10;
    }
  };

  const currentIndex = getStepIndex(order.orderStatus);
  const progressPercentage = getProgressPercentage(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED';

  return (
    <div className="w-full space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md shadow-emerald-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Order #{order.orderNumber}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold uppercase ${
                order.paymentStatus === 'PAID' ? 'bg-white text-emerald-900' : 'bg-amber-300 text-amber-950'
              }`}>
                {order.paymentStatus} ({order.paymentMethod})
              </span>
            </div>
            <h1 className="text-2xl font-black mt-2">Yazhisai Live Order Tracker</h1>
            <p className="text-xs text-emerald-100 mt-1 font-semibold">
              Booked for: <span className="font-extrabold underline">{order.bookingDate}</span> ({order.slotType} Slot)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right">
            <span className="text-xs text-emerald-100 block font-semibold">Total Amount</span>
            <span className="text-2xl font-black text-white">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Cancelled Alert */}
      {isCancelled && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 font-bold">
          <AlertCircle className="w-6 h-6 shrink-0 text-rose-600" />
          <div>
            <h4 className="font-extrabold">Order Cancelled</h4>
            <p className="text-xs text-rose-700 font-semibold">This pre-order was cancelled by the kitchen admin.</p>
          </div>
        </div>
      )}

      {/* Stepper Grid */}
      {!isCancelled && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* Animated Horizontal Progress Bar */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-700 uppercase tracking-wider text-[11px]">Kitchen Progress</span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black border border-emerald-300">
                {progressPercentage}% Complete
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isDone = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={s.key} className="relative flex flex-col items-center text-center group">
                  
                  {/* Icon Circle */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                      isDone
                        ? isCurrent
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-110'
                          : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h4 className={`text-xs font-bold mt-3 ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[130px] leading-tight font-medium">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Rider GPS Map (Visible when OUT_FOR_DELIVERY or DELIVERED) */}
      {(order.orderStatus === 'OUT_FOR_DELIVERY' || order.orderStatus === 'DELIVERED') && (
        <LiveRiderMap
          orderId={order.id}
          orderStatus={order.orderStatus}
          deliveryAddress={order.deliveryAddress}
          deliveryPartner={order.deliveryPartner}
        />
      )}

      {/* Details & Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">
            Delivery Information
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">Customer Contact</span>
                <span className="font-bold text-slate-900">{order.customerName}</span> ({order.customerPhone})
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">Address</span>
                <span className="font-bold text-slate-800">{order.deliveryAddress}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">Preference</span>
                <span className="font-bold text-slate-800">{order.preferredTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">
            Item Summary ({order.items.length} dishes)
          </h3>

          <div className="space-y-3">
            {order.items.map((item: any) => {
              const isReviewed = reviewedItemIds.includes(item.menuItemId);

              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">{item.menuItemName}</h4>
                    <span className="text-slate-500 font-semibold">Qty: {item.quantity} x ₹{item.unitPrice}</span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="font-black text-emerald-700 text-sm">₹{item.totalPrice}</span>

                    {/* Rate Dish Prompt on DELIVERED Orders */}
                    {isDelivered && (
                      <div>
                        {isReviewed ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reviewed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewModalItem(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-[11px] shadow-sm transition-all transform hover:scale-105"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                            <span>Rate this dish</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-1 text-xs text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-slate-900 font-bold">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="text-slate-900 font-bold">₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-emerald-700 text-base">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Verified Review Modal */}
      {reviewModalItem && (
        <ReviewModal
          isOpen={Boolean(reviewModalItem)}
          onClose={() => setReviewModalItem(null)}
          orderId={order.id}
          menuItemId={reviewModalItem.menuItemId}
          dishName={reviewModalItem.menuItemName}
          customerPhone={order.customerPhone}
          onSuccess={() => {
            if (reviewModalItem) {
              setReviewedItemIds((prev) => [...prev, reviewModalItem.menuItemId]);
            }
          }}
        />
      )}

    </div>
  );
};
