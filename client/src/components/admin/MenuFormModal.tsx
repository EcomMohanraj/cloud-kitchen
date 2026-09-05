'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { MenuService } from '@/services/api';
import { MenuItemCRUDSchema } from '@/lib/validators';

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit?: any | null;
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
  const [price, setPrice] = useState<number | ''>(100);
  const [slotCategory, setSlotCategory] = useState<'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER'>('BREAKFAST');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isVeg, setIsVeg] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(20);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setNameTamil(itemToEdit.nameTamil || '');
      setDescription(itemToEdit.description || '');
      setPrice(itemToEdit.price || 100);
      setSlotCategory(itemToEdit.slotCategory || 'BREAKFAST');
      setIsAvailable(itemToEdit.isAvailable ?? true);
      setIsVeg(itemToEdit.isVeg ?? true);
      setImageUrl(itemToEdit.imageUrl || '');
      setIngredients(itemToEdit.ingredients || '');
      setPrepTimeMinutes(itemToEdit.prepTimeMinutes || 20);
    } else {
      setName('');
      setNameTamil('');
      setDescription('Freshly prepared traditional South Indian gourmet delicacy.');
      setPrice(140);
      setSlotCategory('BREAKFAST');
      setIsAvailable(true);
      setIsVeg(true);
      setImageUrl('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80');
      setIngredients('Rice, Spices, Ghee');
      setPrepTimeMinutes(20);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Zod Schema Validation for Menu Item CRUD
    const validationResult = MenuItemCRUDSchema.safeParse({
      name,
      nameTamil: nameTamil || undefined,
      description,
      price: Number(price),
      categorySlot: slotCategory,
      isVeg,
      imageUrl: imageUrl || undefined,
      prepTimeMinutes: Number(prepTimeMinutes),
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Validation failed';
      setErrorMsg(firstError);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        nameTamil,
        description,
        price: Number(price),
        slotCategory,
        isAvailable,
        isVeg,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        ingredients,
        prepTimeMinutes: Number(prepTimeMinutes),
      };

      if (itemToEdit) {
        await MenuService.updateMenuItem({ id: itemToEdit.id, ...payload });
        setSuccessMsg('Dish updated successfully!');
      } else {
        await MenuService.createMenuItem(payload);
        setSuccessMsg('New gourmet dish created successfully!');
      }

      setLoading(false);
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            {itemToEdit ? <Edit2 className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            {itemToEdit ? 'Edit Gourmet Dish' : 'Create New Yazhisai Dish'}
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-extrabold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-extrabold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Dish Name (English) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Madurai Kari Dosa"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Dish Name (Tamil)</label>
              <input
                type="text"
                value={nameTamil}
                onChange={(e) => setNameTamil(e.target.value)}
                placeholder="e.g. மதுரை காரி தோசை"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-extrabold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Meal Slot *</label>
              <select
                value={slotCategory}
                onChange={(e) => setSlotCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-bold"
              >
                {MEAL_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Diet Type *</label>
              <select
                value={isVeg ? 'VEG' : 'NONVEG'}
                onChange={(e) => setIsVeg(e.target.value === 'VEG')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-bold"
              >
                <option value="VEG">🌱 Pure Veg</option>
                <option value="NONVEG">🍗 Non-Veg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description *</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Food Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Key Ingredients</label>
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Prep Time (mins) *</label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Dish Active for Pre-Ordering</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Saving...' : itemToEdit ? 'Update Dish' : 'Create Dish'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
