'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Lock, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { PaymentService } from '@/services/api';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  order?: any;
  orderDetails?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, orderDetails, isOpen, onClose }) => {
  const router = useRouter();
  const { clearCart } = useCartStore();

  const targetOrder = order || orderDetails;

  const [paymentTab, setPaymentTab] = useState<'UPI' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'OTP' | 'SUCCESS'>('SELECT');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');

  React.useEffect(() => {
    if (step === 'SUCCESS' && !txnId) {
      setTxnId(`TXN_${Math.floor(10000000 + Math.random() * 90000000)}`);
    }
  }, [step, txnId]);

  if (!isOpen || !targetOrder) return null;

  const handlePayNow = async () => {
    setLoading(true);
    setStep('PROCESSING');

    try {
      if (typeof window === 'undefined') return;

      const loadScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      if (!loaded) {
        throw new Error('Razorpay Checkout SDK failed to load.');
      }

      const rzpData = await PaymentService.createRazorpayOrder(targetOrder.totalAmount, targetOrder.id);
      if (!rzpData || !rzpData.razorpayOrderId) {
        throw new Error('Failed to initialize Razorpay order');
      }

      const options = {
        key: rzpData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'Yazhisai Cloud Kitchen',
        description: `Order #${targetOrder.orderNumber || targetOrder.id}`,
        order_id: rzpData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await PaymentService.verifyPayment({
              orderId: targetOrder.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes && verifyRes.success) {
              setTxnId(response.razorpay_payment_id);
              setStep('SUCCESS');
              clearCart();
              setTimeout(() => {
                onClose();
                router.push(`/track/${targetOrder.id}`);
              }, 1800);
            } else {
              alert('Payment verification failed!');
              setStep('SELECT');
            }
          } catch (vErr: any) {
            alert('Verification error: ' + vErr.message);
            setStep('SELECT');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setStep('SELECT');
            setLoading(false);
          },
        },
        prefill: {
          name: targetOrder.customerName,
          contact: targetOrder.customerPhone,
        },
        theme: {
          color: '#059669',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        alert(`Payment Failed: ${resp.error?.description || 'Declined'}`);
        setStep('SELECT');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment error');
      setStep('SELECT');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    await handlePayNow();
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
            <span>Order #{targetOrder.orderNumber}</span>
            <span className="block text-[10px] text-slate-500">{targetOrder.customerName}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Amount to Pay</span>
            <span className="text-lg font-black text-emerald-800">₹{targetOrder.totalAmount}</span>
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=yazhisai@upi&pn=Yazhisai%20Kitchen&am=${targetOrder.totalAmount}`}
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
                <span>Pay ₹{targetOrder.totalAmount} Securely</span>
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
                  Enter 6-digit OTP sent to {targetOrder.customerPhone}
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
                Transaction ID: <span className="font-mono text-emerald-700 font-bold">{txnId}</span>
              </p>
              <p className="text-xs text-slate-500 font-semibold">Redirecting to Order Status Tracker...</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
