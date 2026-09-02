'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Utensils, Sparkles, RefreshCw } from 'lucide-react';
import { MenuFormModal } from '@/components/admin/MenuFormModal';
import { MEAL_SLOTS } from '@/lib/constants';
import { MenuService } from '@/services/api';

// Fallback South Indian Menu Items if database seed is initializing
const DEFAULT_SOUTH_INDIAN_ITEMS = [
  {
    id: 'm-1',
    name: 'Chettinad Idli Platter',
    nameTamil: 'செட்டிநாடு இட்லி பிளேட்டர்',
    description: '4 Soft steaming Malligai Idlis served with 3 traditional chutneys & homemade sambar.',
    price: 80,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice, Urad Dal, Ghee, Coconut Chutney, Tomato Chutney, Sambar',
    prepTimeMinutes: 15,
  },
  {
    id: 'm-2',
    name: 'Crispy Ghee Podi Roast Dosa',
    nameTamil: 'நெய் பொடி தோசை',
    description: 'Golden crispy rice crepe sprinkled with hand-ground spicy podi and pure cow ghee.',
    price: 110,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Pure Cow Ghee, Gunpowder Podi, Coconut Chutney',
    prepTimeMinutes: 15,
  },
  {
    id: 'm-3',
    name: 'Medhu Vada (2 Pcs)',
    nameTamil: 'மெது வடை',
    description: 'Crispy deep-fried golden lentil fritters spiced with black pepper, ginger, and curry leaves.',
    price: 50,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Urad Dal, Black Pepper, Fresh Ginger, Curry Leaves, Coconut Chutney',
    prepTimeMinutes: 10,
  },
  {
    id: 'm-4',
    name: 'Traditional Rava Kichadi',
    nameTamil: 'ரவா கிச்சடி',
    description: 'Roasted semolina cooked with fresh green peas, carrots, cashews, and aromatic ghee.',
    price: 75,
    slotCategory: 'BREAKFAST',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rava, Vegetables, Cashews, Ghee, Mustard Seeds, Green Chilies',
    prepTimeMinutes: 15,
  },
  {
    id: 'm-5',
    name: 'Madurai Kara Murukku & Filter Coffee',
    nameTamil: 'கார முறுக்கு & ஃபில்டர் காபி',
    description: 'Crunchy traditional rice flour murukku paired with authentic Kumbakonam brass filter coffee.',
    price: 90,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Sesame, Spices, Roasted Coffee Decoction, Fresh Milk',
    prepTimeMinutes: 10,
  },
  {
    id: 'm-6',
    name: 'Crispy Onion Pakoda',
    nameTamil: 'வெங்காய பகோடா',
    description: 'Thinly sliced crispy fried onion fritters seasoned with fennel seeds and curry leaves.',
    price: 60,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Onions, Besan, Rice Flour, Fennel, Green Chilies',
    prepTimeMinutes: 15,
  },
  {
    id: 'm-7',
    name: 'Vazhaipoo Cutlet (Banana Flower Cutlet)',
    nameTamil: 'வாழைப்பூ கட்லெட்',
    description: 'Healthy minced banana blossom patties pan-fried to crispy golden perfection.',
    price: 85,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Banana Flower, Potato, Fennel, Breadcrumbs, Spices',
    prepTimeMinutes: 20,
  },
  {
    id: 'm-8',
    name: 'Chana Sundaal & Tea Combo',
    nameTamil: 'சுண்டல் & டீ',
    description: 'Spiced boiled chickpeas tempered with mustard, red chilies, and fresh grated coconut.',
    price: 50,
    slotCategory: 'SNACKS',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    ingredients: 'White Chickpeas, Coconut, Mustard Seeds, Curry Leaves, Chai',
    prepTimeMinutes: 10,
  },
  {
    id: 'm-9',
    name: 'Kongu Naattu Kozhi Briyani',
    nameTamil: 'கொங்கு நாட்டுக்கோழி பிரியாணி',
    description: 'Authentic Seeraga Samba rice briyani cooked with free-range country chicken and hand-pounded spices.',
    price: 240,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seeraga Samba Rice, Nattu Kozhi, Shallots, Ginger-Garlic, Mint, Ghee',
    prepTimeMinutes: 25,
  },
  {
    id: 'm-10',
    name: 'Traditional Tamil Nadu Meals Thali',
    nameTamil: 'தமிழ்நாடு பாரம்பரிய சாப்பாடு',
    description: 'Steamed Ponni rice served with Paruppu, Sambar, Rasam, Vatha Kuzhambu, Kootu, Poriyal, Appalam, & Payasam.',
    price: 160,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Ponni Rice, Sambar, Rasam, Vatha Kuzhambu, Poriyal, Kootu, Appalam, Curd',
    prepTimeMinutes: 20,
  },
  {
    id: 'm-11',
    name: 'Chettinad Fish Curry Meal',
    nameTamil: 'செட்டிநாடு மீன் குழம்பு',
    description: 'Spicy tangy seer fish curry cooked in authentic earthen pots with shallots and tamarind.',
    price: 260,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Seer Fish, Tamarind, Shallots, Chettinad Spices, Steamed Rice',
    prepTimeMinutes: 25,
  },
  {
    id: 'm-12',
    name: 'Mushroom Biryani',
    nameTamil: 'காளான் பிரியாணி',
    description: 'Aromatic Seeraga Samba rice cooked with organic fresh mushrooms and fresh herbs.',
    price: 180,
    slotCategory: 'LUNCH',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Fresh Mushrooms, Seeraga Samba Rice, Mint, Whole Spices, Onion Raitha',
    prepTimeMinutes: 20,
  },
  {
    id: 'm-13',
    name: 'Kothu Parotta Deluxe',
    nameTamil: 'கொத்து பரோட்டா',
    description: 'Flaky shredded parottas tossed on hot iron griddle with eggs, chicken gravy, onions, and green chilies.',
    price: 150,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Parotta, Eggs, Chicken Salna, Onions, Green Chilies, Pepper',
    prepTimeMinutes: 20,
  },
  {
    id: 'm-14',
    name: 'Madurai Bun Parotta (2 Pcs)',
    nameTamil: 'மதுரை பன் பரோட்டா',
    description: 'Thick, fluffy, soft bun-shaped golden fried parottas served with rich spicy Salna gravy.',
    price: 120,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Flour, Milk, Ghee, Spicy Salna Gravy, Onion Raitha',
    prepTimeMinutes: 20,
  },
  {
    id: 'm-15',
    name: 'Kal Dosa with Meen Kuzhambu / Sambar',
    nameTamil: 'கல் தோசை',
    description: 'Soft sponge-like thick dosas cooked on heavy iron tawa served with rich curry.',
    price: 100,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Dosa Batter, Fish Gravy / Sambar, Coconut Chutney',
    prepTimeMinutes: 15,
  },
  {
    id: 'm-16',
    name: 'Idiyappam with Coconut Milk (4 Pcs)',
    nameTamil: 'இடியாப்பம் தேங்காய்ப்பால்',
    description: 'Steamed delicate string hoppers served with sweet cardamom infused fresh coconut milk.',
    price: 90,
    slotCategory: 'DINNER',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Rice Flour, Fresh Coconut Milk, Cardamom, Sugar',
    prepTimeMinutes: 15,
  },
];

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>(DEFAULT_SOUTH_INDIAN_ITEMS);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchMenu = async () => {
    try {
      const data = await MenuService.getMenuItems(undefined, true);
      if (data.items && data.items.length > 0) {
        setMenuItems(data.items);
      } else {
        setMenuItems(DEFAULT_SOUTH_INDIAN_ITEMS);
      }
    } catch (error) {
      console.error(error);
      setMenuItems(DEFAULT_SOUTH_INDIAN_ITEMS);
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
      await MenuService.deleteMenuItem(id);
      fetchMenu();
    } catch (error) {
      console.error(error);
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
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
            Create, update, upload food photos, set prices, and assign slot categories (Breakfast, Snacks, Lunch, Dinner).
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

      {/* Items Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-900 border border-emerald-200 shadow-sm uppercase tracking-wider">
                {item.slotCategory}
              </div>
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-emerald-950 border border-emerald-200 shadow-sm">
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
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                item.isAvailable ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {item.isAvailable ? 'Available' : 'Inactive'}
              </span>

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
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors"
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
