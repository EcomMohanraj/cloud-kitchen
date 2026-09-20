'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, AlertCircle, CheckCircle2, Upload, Loader2, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { MEAL_SLOTS } from '@/lib/constants';
import { MenuService } from '@/services/api';
import { MenuItemCRUDSchema } from '@/lib/validators';

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit?: any | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
  
  // Image Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadingImage(false);
    setUploadError('');

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
      setImageUrl('');
      setIngredients('Rice, Spices, Ghee');
      setPrepTimeMinutes(20);
    }
  }, [itemToEdit, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const uploadImageFile = async (fileToUpload: File) => {
    setUploadingImage(true);
    setUploadError('');
    try {
      const res = await MenuService.uploadImage(fileToUpload);
      if (res && res.imageUrl) {
        setImageUrl(res.imageUrl);
        setSuccessMsg('Image uploaded to Cloudinary successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(res?.error || 'Failed to obtain Cloudinary URL from server.');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate File Format
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported file format. Please choose a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // 2. Validate File Size (Max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-upload image to backend/Cloudinary upon selection
    uploadImageFile(file);
  };

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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 cursor-default"
      >
        
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

          {/* Food Image Selection & Cloudinary Upload */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Food Image *</label>
            <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200 rounded-2xl">
              
              {/* Image Preview Window */}
              {(previewUrl || imageUrl) ? (
                <div
                  onClick={() => setIsFullImageOpen(true)}
                  className="relative w-full h-40 bg-slate-200 rounded-xl overflow-hidden group/img border border-slate-300 shadow-inner cursor-pointer"
                  title="Click to view full image"
                >
                  <img
                    src={previewUrl || imageUrl}
                    alt="Food Dish Preview"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Full View Hint Badge */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/20 transform scale-95 group-hover/img:scale-100 transition-transform">
                      <Maximize2 className="w-3 h-3 text-emerald-400" />
                      <span>Click to view full image</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm pointer-events-none">
                    {previewUrl ? '📷 New Selection' : '🖼️ Saved Cloudinary Image'}
                  </div>
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                  <span className="text-[11px] font-semibold">No food photo selected yet</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <label className="flex-1 cursor-pointer inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-extrabold text-xs transition-colors text-center shadow-sm">
                  <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{imageUrl || previewUrl ? 'Replace Image' : 'Choose Image'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {selectedFile && !uploadingImage && (
                  <button
                    type="button"
                    onClick={() => uploadImageFile(selectedFile)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Re-Upload to Cloudinary</span>
                  </button>
                )}
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold px-1">
                  <span className="truncate max-w-[220px]">📄 {selectedFile.name}</span>
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              )}

              {/* Upload Loading Indicator */}
              {uploadingImage && (
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs animate-pulse px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                  <span>Uploading image to Cloudinary...</span>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-extrabold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
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
              disabled={loading || uploadingImage}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : itemToEdit ? 'Update Dish' : 'Create Dish'}
            </button>
          </div>

        </form>
      </div>

      {/* Full Image Preview Modal */}
      {isFullImageOpen && (previewUrl || imageUrl) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsFullImageOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsFullImageOpen(false)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md transition-all shadow-lg border border-white/20 hover:scale-105"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Uncropped Full Image */}
            <div className="w-full max-h-[72vh] flex items-center justify-center bg-black/50 overflow-hidden p-2 sm:p-4">
              <img
                src={previewUrl || imageUrl}
                alt="Food Dish Preview"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            </div>

            {/* Footer Info */}
            <div className="w-full p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base text-white">{name || 'Dish Photo Preview'}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedFile ? `File: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Uploaded to Cloudinary'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullImageOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
