'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ReviewService } from '@/services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  menuItemId: string;
  dishName: string;
  customerPhone?: string;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  menuItemId,
  dishName,
  customerPhone,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ReviewService.createReview({
        orderId,
        menuItemId,
        rating,
        comment: comment.trim(),
        phone: customerPhone,
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setComment('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Verified Order Review
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1 line-clamp-1">
              Rate {dishName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-500 font-medium">Your verified review has been published.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Interactive Stars Selector */}
            <div className="text-center space-y-2 py-2 bg-slate-50/70 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Star Rating
              </label>
              <div className="flex justify-center items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-extrabold text-amber-600 block">
                {rating === 5 && '🌟 Exceptional! Loved it!'}
                {rating === 4 && '😊 Very Delicious'}
                {rating === 3 && '😐 Average Dish'}
                {rating === 2 && '🙁 Could be better'}
                {rating === 1 && '😞 Disappointed'}
              </span>
            </div>

            {/* Optional Comment Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Review / Feedback <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share taste details, freshness, spice level, or presentation..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium resize-none"
                maxLength={500}
              />
              <span className="text-[10px] text-slate-400 text-right block font-semibold">
                {comment.length}/500 chars
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <span>Submit Verified Review</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
