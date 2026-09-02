'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Lock, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, isOpen, onClose }) => {
  const router = useRouter();
  const { clearCart } = useCartStore();

  const [paymentTab, setPaymentTab] = useState<'UPI' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'OTP' | 'SUCCESS'>('SELECT');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handlePayNow = () => {
    setStep('PROCESSING');
    setTimeout(() => {
      setStep('OTP');
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentId: mockPaymentId,
          status: 'PAID',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setStep('SUCCESS');
      clearCart();

      setTimeout(() => {
        onClose();
        router.push(`/track/${order.id}`);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Payment error');
      setStep('SELECT');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white border border-emerald-300 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        
        {/* Gateway Brand Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">Razorpay Secure Checkout</h3>
              <p className="text-[10px] text-emerald-100">256-Bit SSL Encrypted Payment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Bar */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
          <div>
            <span>Order #{order.orderNumber}</span>
            <span className="block text-[10px] text-slate-500">{order.customerName}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Amount to Pay</span>
            <span className="text-lg font-black text-emerald-800">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Modal Body Steps */}
        <div className="p-6">
          
          {step === 'SELECT' && (
            <div className="space-y-4">
              
              {/* Payment Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setPaymentTab('UPI')}
                  className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
                    paymentTab === 'UPI'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR Code</span>
                </button>

                <button
                  onClick={() => setPaymentTab('CARD')}
                  className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
                    paymentTab === 'CARD'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Debit / Credit Card</span>
                </button>
              </div>

              {paymentTab === 'UPI' ? (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=yazhisai@upi&pn=Yazhisai%20Kitchen&am=${order.totalAmount}`}
                      alt="UPI QR Code"
                      className="w-32 h-32"
                    />
                    <p className="text-[10px] font-bold text-slate-700 mt-1">Scan with GPay / PhonePe / Paytm</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-700 font-bold mb-1">Or Enter Virtual Payment Address (VPA)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs text-slate-700 font-bold mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-700 font-bold mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-700 font-bold mb-1">CVV</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayNow}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Pay ₹{order.totalAmount} Securely</span>
              </button>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <p className="text-base font-extrabold text-slate-900">Contacting Payment Gateway...</p>
              <p className="text-xs text-slate-500 font-semibold">Do not refresh or close this window.</p>
            </div>
          )}

          {step === 'OTP' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">3D Secure OTP Authentication</h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Enter 6-digit OTP sent to {order.customerPhone}
                </p>
              </div>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-44 mx-auto text-center tracking-[0.5em] font-mono text-xl py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 font-extrabold"
              />

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authorize Payment</span>}
              </button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
              <h4 className="text-xl font-black text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-600 font-semibold">
                Transaction ID: <span className="font-mono text-emerald-700 font-bold">TXN_{Math.floor(10000000 + Math.random() * 90000000)}</span>
              </p>
              <p className="text-xs text-slate-500 font-semibold">Redirecting to Order Status Tracker...</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
