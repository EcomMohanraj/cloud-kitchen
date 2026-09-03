-- ============================================================================
-- YAZHISAI CLOUD KITCHEN - DATABASE MIGRATION 004
-- Admin Business Intelligence & Metrics Aggregate RPC Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics(target_month DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sales', COALESCE(SUM(total_amount), 0),
    'total_orders', COUNT(id),
    'monthly_sales', COALESCE(SUM(CASE WHEN date_trunc('month', booking_date) = date_trunc('month', target_month) THEN total_amount ELSE 0 END), 0),
    'monthly_orders', COUNT(CASE WHEN date_trunc('month', booking_date) = date_trunc('month', target_month) THEN 1 END),
    'pending_orders', COUNT(CASE WHEN order_status IN ('PENDING', 'ACCEPTED') THEN 1 END),
    'in_progress_orders', COUNT(CASE WHEN order_status = 'PREPARING' THEN 1 END),
    'delivered_orders', COUNT(CASE WHEN order_status = 'DELIVERED' THEN 1 END),
    'cancelled_orders', COUNT(CASE WHEN order_status = 'CANCELLED' THEN 1 END),
    'todays_cooking_load', COUNT(CASE WHEN booking_date = CURRENT_DATE AND order_status IN ('ACCEPTED', 'PREPARING') THEN 1 END),
    'slot_breakdown', json_build_object(
      'breakfast', COUNT(CASE WHEN slot_type = 'BREAKFAST' THEN 1 END),
      'snacks', COUNT(CASE WHEN slot_type = 'SNACKS' THEN 1 END),
      'lunch', COUNT(CASE WHEN slot_type = 'LUNCH' THEN 1 END),
      'dinner', COUNT(CASE WHEN slot_type = 'DINNER' THEN 1 END)
    )
  ) INTO result
  FROM public.orders
  WHERE order_status != 'CANCELLED';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
