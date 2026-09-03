import { supabase } from '@/lib/supabaseClient';
import { MenuItemRow, SlotType } from '@/types/database';

export async function fetchMenuItemsBySlot(slotType: string) {
  const formattedSlot = (slotType ? slotType.toUpperCase() : 'BREAKFAST') as SlotType;
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_slot', formattedSlot)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching menu items from Supabase:', error);
    return [];
  }
  return data || [];
}

export const menuService = {
  getMenuItems: fetchMenuItemsBySlot,

  async createOrUpdateMenuItem(item: Partial<MenuItemRow>) {
    const { data, error } = await supabase
      .from('menu_items')
      .upsert(item as any)
      .select()
      .single();

    if (error) {
      console.error('Error saving menu item:', error);
      throw error;
    }
    return data;
  },

  async deleteMenuItem(id: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },
};
