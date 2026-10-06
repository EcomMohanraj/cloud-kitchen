'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Utensils, Sparkles, RefreshCw, CheckCircle2, AlertCircle, X, Maximize2, Loader2 } from 'lucide-react';
import { MenuFormModal } from '@/components/admin/MenuFormModal';
import { MEAL_SLOTS } from '@/lib/constants';
import { MenuService } from '@/services/api';

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMenu = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await MenuService.getMenuItems(undefined, true);
      setMenuItems(data.items);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleDishAvailability = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistic update
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: nextStatus } : item))
    );

    try {
      await MenuService.updateMenuItem({ id, isAvailable: nextStatus });
    } catch (error) {
      console.error('Failed to toggle dish availability:', error);
      // Revert state on failure
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isAvailable: currentStatus } : item))
      );
    }
  };

  const handleDeleteItem = async (id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this menu item'}"?`)) return;

    setMessage(null);
    try {
      await MenuService.deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
      setMessage({ type: 'success', text: `Menu item "${name || id}" was deleted successfully.` });
    } catch (error: any) {
      console.error('Failed to delete menu item:', error);
      setMessage({
        type: 'error',
        text: error?.message || 'Cannot delete this menu item.',
      });
    }
  };

  const filteredItems = selectedCategory === 'ALL'
    ? menuItems
    : menuItems.filter((i) => i.slotCategory === selectedCategory);

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>South Indian Gourmet Catalog • தென்னிந்திய உணவுப்பட்டியல்</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-600" />
            Yazhisai Menu Management & Food Items CRUD
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Create, update, toggle dish availability, upload food photos, set prices, and assign slot categories (Breakfast, Snacks, Lunch, Dinner).
          </p>
        </div>

        <button
          onClick={() => {
            setItemToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food Item</span>
        </button>
      </div>

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

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-[#059669] border-[#059669] text-white shadow-sm font-black'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          All Items ({menuItems.length})
        </button>

        {MEAL_SLOTS.map((s) => {
          const count = menuItems.filter((i) => i.slotCategory === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedCategory(s.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                selectedCategory === s.id
                  ? 'bg-[#059669] border-[#059669] text-white shadow-sm font-black'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Load / Error / Empty States */}
      {loading && menuItems.length === 0 ? (
        <div className="py-20 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading menu...</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="py-16 text-center space-y-3 bg-white rounded-3xl border border-rose-200">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">Unable to load menu, please try again</h3>
          <p className="text-xs text-slate-500 font-medium">The menu could not be fetched from the server. No changes were made.</p>
          <button
            onClick={fetchMenu}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white rounded-3xl border border-slate-200">
          <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-700 text-base">No menu items yet</h3>
          <p className="text-xs text-slate-500 font-medium">Use &quot;Add New Food Item&quot; to create your first dish.</p>
        </div>
      ) : null}

      {/* Items Table / Grid */}
      {!loadError && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div
              className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer group/img"
              onClick={() => setPreviewItem(item)}
              title={`Click to view full photo of ${item.name}`}
            >
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
              
              {/* Soft Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none"></div>

              {/* Hover Full View Hint Badge */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20 transform scale-95 group-hover/img:scale-100 transition-transform">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Click to view full image</span>
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-900 border border-emerald-200 shadow-sm uppercase tracking-wider pointer-events-none">
                {item.slotCategory}
              </div>
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-emerald-950 border border-emerald-200 shadow-sm pointer-events-none">
                ₹{item.price}
              </div>
            </div>

            <div className="p-5 space-y-2.5 flex-1">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{item.name}</h3>
                {item.nameTamil && (
                  <p className="text-xs text-emerald-800 font-bold mt-0.5">{item.nameTamil}</p>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed">{item.description}</p>

              {item.ingredients && (
                <p className="text-[11px] text-slate-500 truncate pt-2 border-t border-slate-100 font-semibold">
                  <span className="font-bold text-slate-700">Ingredients:</span> {item.ingredients}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              {/* Dish-Level Availability iOS-Style Toggle Switch */}
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                  item.isAvailable ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isAvailable)}
                    onChange={() => handleToggleDishAvailability(item.id, Boolean(item.isAvailable))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setItemToEdit(item);
                    setIsModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors"
                  title="Delete menu item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* CRUD Modal */}
      <MenuFormModal
        isOpen={isModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={() => {
          setMessage({ type: 'success', text: 'Menu catalog updated successfully.' });
          fetchMenu();
        }}
      />

      {/* Full Image Preview Lightbox Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md transition-all shadow-lg border border-white/20 hover:scale-105"
              aria-label="Close full image preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Uncropped Full Image Container */}
            <div className="w-full max-h-[72vh] flex items-center justify-center bg-black/50 overflow-hidden p-2 sm:p-4">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.name}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            </div>

            {/* Bottom Bar with Details & Quick Actions */}
            <div className="w-full p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {previewItem.slotCategory}
                  </span>
                  <h3 className="text-lg font-black text-white">{previewItem.name}</h3>
                  {previewItem.nameTamil && (
                    <span className="text-xs text-emerald-400 font-bold">({previewItem.nameTamil})</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    previewItem.isAvailable ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {previewItem.isAvailable ? 'Available' : 'Sold Out'}
                  </span>
                </div>
                {previewItem.description && (
                  <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">{previewItem.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-2xl font-black text-white">₹{previewItem.price}</span>
                <button
                  onClick={() => {
                    const itemToUpdate = previewItem;
                    setPreviewItem(null);
                    setItemToEdit(itemToUpdate);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Dish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

