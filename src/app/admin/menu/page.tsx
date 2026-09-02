'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Utensils } from 'lucide-react';
import { MenuFormModal } from '@/components/admin/MenuFormModal';
import { MEAL_SLOTS } from '@/lib/constants';

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu?all=true');
      const data = await res.json();
      if (data.items) setMenuItems(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMenu();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredItems = selectedCategory === 'ALL'
    ? menuItems
    : menuItems.filter((i) => i.slotCategory === selectedCategory);

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            Yazhisai Menu Management & Food Items CRUD
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Create, update, upload food photos, set prices, and assign slot categories.
          </p>
        </div>

        <button
          onClick={() => {
            setItemToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedCategory === s.id
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div className="relative h-44 bg-slate-100">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 border border-emerald-200 shadow-sm">
                {item.slotCategory}
              </div>
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-slate-800 border border-slate-200 shadow-sm">
                ₹{item.price}
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{item.name}</h3>
                {item.nameTamil && (
                  <p className="text-xs text-emerald-700 font-bold">{item.nameTamil}</p>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 font-medium">{item.description}</p>

              {item.ingredients && (
                <p className="text-[11px] text-slate-500 truncate pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700">Ingredients:</span> {item.ingredients}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold ${
                item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {item.isAvailable ? 'Available' : 'Inactive'}
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setItemToEdit(item);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Modal */}
      <MenuFormModal
        isOpen={isModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchMenu}
      />

    </div>
  );
}
