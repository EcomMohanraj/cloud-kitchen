'use client';

import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ReviewService, MenuService } from '@/services/api';
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Menu as MenuIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Utensils,
  User,
  ShoppingBag,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL | PUBLISHED | HIDDEN
  const [searchQuery, setSearchQuery] = useState('');

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await ReviewService.getAdminReviews();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err: any) {
      console.error('Failed to load admin reviews:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to fetch customer reviews' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await ReviewService.toggleHideReview(id);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isHidden: !currentHidden } : r))
        );
        setMessage({
          type: 'success',
          text: `Review has been ${!currentHidden ? 'hidden from storefront' : 'unhidden and published'}.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update review status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await ReviewService.deleteReview(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setMessage({ type: 'success', text: 'Review deleted permanently.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete review' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== 'ALL' && r.rating !== Number(ratingFilter)) return false;
    if (statusFilter === 'PUBLISHED' && r.isHidden) return false;
    if (statusFilter === 'HIDDEN' && !r.isHidden) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const reviewerName = (r.user?.name || '').toLowerCase();
      const dishName = (r.menuItem?.name || '').toLowerCase();
      const commentText = (r.comment || '').toLowerCase();
      const orderNum = (r.order?.orderNumber || '').toLowerCase();
      return (
        reviewerName.includes(query) ||
        dishName.includes(query) ||
        commentText.includes(query) ||
        orderNum.includes(query)
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalReviews = reviews.length;
  const publishedReviews = reviews.filter((r) => !r.isHidden).length;
  const hiddenReviews = reviews.filter((r) => r.isHidden).length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Customer Reviews & Moderation
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Manage verified order dish ratings, soft-hide feedback, or inspect patron comments.
              </p>
            </div>
          </div>

          <button
            onClick={fetchReviews}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-2 transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-8 space-y-6 flex-1">
          
          {/* Notification Alert */}
          {message && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Reviews</span>
              <div className="text-3xl font-black text-slate-900">{totalReviews}</div>
              <span className="text-[10px] text-emerald-700 font-extrabold block">Verified Patron Ratings</span>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Published on Site</span>
              <div className="text-3xl font-black text-emerald-600">{publishedReviews}</div>
              <span className="text-[10px] text-slate-400 font-bold block">Visible to storefront customers</span>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hidden / Moderated</span>
              <div className="text-3xl font-black text-amber-600">{hiddenReviews}</div>
              <span className="text-[10px] text-amber-700 font-bold block">Soft-deleted from public view</span>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Dish Score</span>
              <div className="text-3xl font-black text-amber-500 flex items-center gap-1">
                ★ {avgRating}
              </div>
              <span className="text-[10px] text-slate-500 font-bold block">Across all menu items</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patron name, dish, order #, or comment..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Rating Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
                {['ALL', '5', '4', '3', '2', '1'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRatingFilter(val)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      ratingFilter === val
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {val === 'ALL' ? 'All Stars' : `★ ${val}`}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Visibility</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="HIDDEN">Hidden Only</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">Loading customer reviews...</p>
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Customer / Patron</th>
                      <th className="py-3.5 px-6">Dish & Order</th>
                      <th className="py-3.5 px-6">Rating & Comment</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Customer */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-xs">
                              {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {rev.user?.name || 'Verified Patron'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {rev.user?.phone || 'No Phone'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dish & Order */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block">
                              {rev.menuItem?.name || 'Menu Item'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block">
                              Order #{rev.order?.orderNumber || rev.orderId?.slice(0, 8)}
                            </span>
                          </div>
                        </td>

                        {/* Rating & Comment */}
                        <td className="py-4 px-6 max-w-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-amber-500 font-black">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                              <span className="text-slate-900 ml-1 text-xs">({rev.rating}/5)</span>
                            </div>

                            {rev.comment ? (
                              <p className="text-slate-700 font-medium italic line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                                &ldquo;{rev.comment}&rdquo;
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No text comment provided</span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-slate-500 font-semibold shrink-0">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {rev.isHidden ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300">
                              <EyeOff className="w-3 h-3 text-amber-700" />
                              <span>Hidden</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] border border-emerald-300">
                              <Eye className="w-3 h-3 text-emerald-700" />
                              <span>Published</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => handleToggleHide(rev.id, rev.isHidden)}
                            disabled={actionLoadingId === rev.id}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border ${
                              rev.isHidden
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                            }`}
                          >
                            {rev.isHidden ? 'Publish / Unhide' : 'Hide from Site'}
                          </button>

                          <button
                            onClick={() => handleDelete(rev.id)}
                            disabled={actionLoadingId === rev.id}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="Delete review permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-extrabold text-slate-800">No Reviews Found</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  {searchQuery || ratingFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'No reviews match your selected filter criteria.'
                    : 'No verified customer reviews have been submitted yet.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
