import { supabase } from '@/lib/supabaseClient';
import { OrderRow } from '@/types/database';

export const orderService = {
  async getCustomerOrders(userId?: string, phone?: string): Promise<OrderRow[]> {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (phone) {
      query = query.eq('customer_phone', phone);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
    return data || [];
  },

  async createOrder(orderPayload: Partial<OrderRow>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderPayload as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating order in Supabase:', error);
      throw error;
    }
    return data;
  },

  async updateOrderStatus(orderId: string, orderStatus: string, paymentStatus?: string) {
    const updatePayload: any = { order_status: orderStatus };
    if (paymentStatus) updatePayload.payment_status = paymentStatus;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
    return data;
  },
};
