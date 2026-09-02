export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SlotType = 'BREAKFAST' | 'SNACKS' | 'LUNCH' | 'DINNER';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          delivery_address: string | null;
          is_admin: boolean;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone: string;
          delivery_address?: string | null;
          is_admin?: boolean;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          delivery_address?: string | null;
          is_admin?: boolean;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slot_schedules: {
        Row: {
          id: string;
          date: string;
          slot_type: SlotType;
          is_available: boolean;
          max_capacity: number;
          current_orders: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          slot_type: SlotType;
          is_available?: boolean;
          max_capacity?: number;
          current_orders?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          slot_type?: SlotType;
          is_available?: boolean;
          max_capacity?: number;
          current_orders?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          tamil_name: string | null;
          description: string | null;
          price: number;
          category_slot: SlotType;
          is_veg: boolean;
          image_url: string | null;
          prep_time_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tamil_name?: string | null;
          description?: string | null;
          price: number;
          category_slot: SlotType;
          is_veg?: boolean;
          image_url?: string | null;
          prep_time_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tamil_name?: string | null;
          description?: string | null;
          price?: number;
          category_slot?: SlotType;
          is_veg?: boolean;
          image_url?: string | null;
          prep_time_minutes?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          booking_date: string;
          slot_type: SlotType;
          preferred_time: string | null;
          total_amount: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          order_status: OrderStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          booking_date: string;
          slot_type: SlotType;
          preferred_time?: string | null;
          total_amount: number;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          order_status?: OrderStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          delivery_address?: string;
          booking_date?: string;
          slot_type?: SlotType;
          preferred_time?: string | null;
          total_amount?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          order_status?: OrderStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          menu_item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          menu_item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          menu_item_name?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      slot_type: SlotType;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type SlotScheduleRow = Database['public']['Tables']['slot_schedules']['Row'];
export type MenuItemRow = Database['public']['Tables']['menu_items']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
