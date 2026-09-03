import { supabase } from '@/lib/supabaseClient';
import { OrderRow } from '@/types/database';

export interface AdminMetrics {
  total_sales: number;
  total_orders: number;
  monthly_sales: number;
  monthly_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  todays_cooking_load: number;
  slot_breakdown: {
    breakfast: number;
    snacks: number;
    lunch: number;
    dinner: number;
  };
}

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

  async getAdminMetrics(targetDateStr?: string): Promise<AdminMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
        target_month: targetDateStr || new Date().toISOString().split('T')[0],
      });

      if (!error && data) {
        return data as AdminMetrics;
      }
    } catch (e) {
      console.warn('Supabase RPC get_admin_dashboard_metrics unavailable, computing client fallback:', e);
    }

    // Client-side fallback computation from active orders table
    const { data: orders } = await supabase.from('orders').select('*');
    const allOrders = orders || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();

    const totalSales = allOrders.reduce((sum, o) => sum + (o.order_status !== 'CANCELLED' ? Number(o.total_amount || 0) : 0), 0);
    const monthlyOrders = allOrders.filter((o) => new Date(o.booking_date || o.created_at).getMonth() === currentMonth);
    const monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.order_status !== 'CANCELLED' ? Number(o.total_amount || 0) : 0), 0);

    return {
      total_sales: totalSales,
      total_orders: allOrders.length,
      monthly_sales: monthlySales,
      monthly_orders: monthlyOrders.length,
      pending_orders: allOrders.filter((o) => o.order_status === 'PENDING' || o.order_status === 'ACCEPTED').length,
      in_progress_orders: allOrders.filter((o) => o.order_status === 'PREPARING').length,
      delivered_orders: allOrders.filter((o) => o.order_status === 'DELIVERED').length,
      cancelled_orders: allOrders.filter((o) => o.order_status === 'CANCELLED').length,
      todays_cooking_load: allOrders.filter((o) => (o.booking_date === todayStr || o.created_at?.startsWith(todayStr)) && (o.order_status === 'ACCEPTED' || o.order_status === 'PREPARING')).length,
      slot_breakdown: {
        breakfast: allOrders.filter((o) => (o.slot_type || o.slotCategory) === 'BREAKFAST').length,
        snacks: allOrders.filter((o) => (o.slot_type || o.slotCategory) === 'SNACKS').length,
        lunch: allOrders.filter((o) => (o.slot_type || o.slotCategory) === 'LUNCH').length,
        dinner: allOrders.filter((o) => (o.slot_type || o.slotCategory) === 'DINNER').length,
      },
    };
  },
};
