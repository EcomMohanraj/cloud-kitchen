import { createClient } from '@/lib/supabase/client';
import { SlotScheduleRow, SlotType } from '@/types/database';

export const SupabaseScheduleService = {
  /**
   * Fetch slot schedules for a list of calendar dates with real-time fallback.
   */
  async getSchedule(): Promise<SlotScheduleRow[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('slot_schedules')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching Supabase schedule:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Toggle slot schedule availability for an entire date or a specific slot.
   */
  async toggleSlotSchedule(
    date: string,
    slotType: SlotType,
    isAvailable: boolean
  ): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase
      .from('slot_schedules')
      .upsert(
        {
          date,
          slot_type: slotType,
          is_available: isAvailable,
        },
        { onConflict: 'date,slot_type' }
      );

    if (error) {
      console.error('Error toggling slot schedule:', error);
      return false;
    }

    return true;
  },

  /**
   * Subscribe to real-time order capacity updates on slot_schedules.
   */
  subscribeToScheduleUpdates(onUpdate: (payload: SlotScheduleRow) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel('public:slot_schedules')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slot_schedules' },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as SlotScheduleRow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
