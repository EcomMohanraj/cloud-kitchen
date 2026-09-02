import { createClient } from '@/lib/supabase/client';
import { MenuItemRow, SlotType } from '@/types/database';

export async function fetchMenuItemsBySlot(slotType: string) {
  const supabase = createClient();
  const formattedSlot = (slotType ? slotType.toUpperCase() : 'BREAKFAST') as SlotType;
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_slot', formattedSlot)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
  return data || [];
}

export const SupabaseMenuService = {
  /**
   * Fetch active menu items filtered by category slot.
   */
  async getMenuItemsBySlot(categorySlot?: SlotType): Promise<MenuItemRow[]> {
    const supabase = createClient();

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true);

    if (categorySlot) {
      const formattedSlot = (categorySlot as string).toUpperCase() as SlotType;
      query = query.eq('category_slot', formattedSlot);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching Supabase menu items:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Admin: Add or update menu item.
   */
  async saveMenuItem(item: Partial<MenuItemRow>): Promise<MenuItemRow | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('menu_items')
      .upsert(item as any)
      .select()
      .single();

    if (error) {
      console.error('Error saving menu item:', error);
      return null;
    }

    return data;
  },
};
