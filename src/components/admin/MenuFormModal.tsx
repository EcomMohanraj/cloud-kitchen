'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Image as ImageIcon, Flame } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit: any | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const MenuFormModal: React.FC<MenuFormModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSaveSuccess,
}) => {
  const [name, setName] = useState('');
  const [nameTamil, setNameTamil] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('150');
  const [slotCategory, setSlotCategory] = useState('BREAKFAST');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setNameTamil(itemToEdit.nameTamil || '');
      setDescription(itemToEdit.description || '');
      setPrice(itemToEdit.price?.toString() || '150');
      setSlotCategory(itemToEdit.slotCategory || 'BREAKFAST');
      setIsAvailable(itemToEdit.isAvailable ?? true);
      setImageUrl(itemToEdit.imageUrl || '');
      setIngredients(itemToEdit.ingredients || '');
      setPrepTimeMinutes(itemToEdit.prepTimeMinutes?.toString() || '20');
    } else {
      setName('');
      setNameTamil('');
      setDescription('');
      setPrice('150');
      setSlotCategory('BREAKFAST');
      setIsAvailable(true);
      setImageUrl('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80');
      setIngredients('Rice, Ghee, Spices');
      setPrepTimeMinutes('20');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        nameTamil,
        description,
        price: parseFloat(price),
        slotCategory,
        isAvailable,
        imageUrl,
        ingredients,
        prepTimeMinutes: parseInt(prepTimeMinutes, 10),
      };

      const method = itemToEdit ? 'PUT' : 'POST';
      const bodyData = itemToEdit ? { id: itemToEdit.id, ...payload } : payload;

      const res = await fetch('/api/menu', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save menu item');

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-dark-800">
          <h3 className="text-lg font-bold text-white">
            {itemToEdit ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Item Name (English) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ghee Podi Dosa"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Item Name (Tamil) *</label>
              <input
                type="text"
                required
                value={nameTamil}
                onChange={(e) => setNameTamil(e.target.value)}
                placeholder="e.g. நெய் பொடி தோசை"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short appetizing description"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                step="5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Slot Category</label>
              <select
                value={slotCategory}
                onChange={(e) => setSlotCategory(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                {MEAL_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Prep Time (mins)</label>
              <input
                type="number"
                required
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Image URL *</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Key Ingredients</label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Rice, Ghee, Cashews, Mustard"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-white/10 border-white/20"
            />
            <label htmlFor="isAvailable" className="text-slate-300 font-medium">Available for Ordering</label>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-spice-500 text-white font-bold shadow-glow"
            >
              {loading ? 'Saving...' : itemToEdit ? 'Update Item' : 'Add Item'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
