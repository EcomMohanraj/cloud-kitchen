import { createClient } from '@/lib/supabase/client';
import {
  OrderRow,
  OrderItemRow,
  OrderStatus,
  PaymentStatus,
  SlotType,
  PaymentMethod,
} from '@/types/database';

export interface CreateOrderPayload {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  bookingDate: string;
  slotType: SlotType;
  preferredTime?: string;
  paymentMethod: PaymentMethod;
  items: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export const SupabaseOrderService = {
  /**
   * Create a transactional order with order_items in Supabase.
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderRow | null> {
    const supabase = createClient();

    const orderNumber = `YZH-${Date.now().toString().slice(-6)}`;
    const totalAmount = payload.items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );

    // 1. Insert Master Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: payload.userId || null,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        delivery_address: payload.deliveryAddress,
        booking_date: payload.bookingDate,
        slot_type: payload.slotType,
        preferred_time: payload.preferredTime || 'Standard Slot Window',
        total_amount: totalAmount,
        payment_method: payload.paymentMethod,
        payment_status: payload.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        order_status: 'PENDING',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order in Supabase:', orderError);
      return null;
    }

    // 2. Insert Order Items
    const orderItemsPayload = payload.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      menu_item_name: item.menuItemName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
    }

    return order;
  },

  /**
   * Get order details by ID or Order Number.
   */
  async getOrderById(orderId: string): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
    const supabase = createClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (orderError || !order) return null;

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    return { order, items: items || [] };
  },

  /**
   * Admin: Update Order lifecycle status.
   */
  async updateOrderStatus(
    orderId: string,
    orderStatus?: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<boolean> {
    const supabase = createClient();

    const updatePayload: Partial<OrderRow> = {};
    if (orderStatus) updatePayload.order_status = orderStatus;
    if (paymentStatus) updatePayload.payment_status = paymentStatus;

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    return !error;
  },

  /**
   * Subscribe to real-time order status updates for live tracking.
   */
  subscribeToOrderTracking(orderId: string, onUpdate: (order: OrderRow) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel(`public:orders:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as OrderRow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
