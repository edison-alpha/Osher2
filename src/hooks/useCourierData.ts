import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCourierStats() {
  const { profileId } = useAuth();

  return useQuery({
    queryKey: ['courier-stats', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get assigned orders (paid status, assigned to this courier)
      const { data: assignedOrders, error: assignedError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('courier_id', profileId)
        .in('status', ['assigned', 'paid']);

      if (assignedError) throw assignedError;

      // Get orders in delivery
      const { data: inDeliveryOrders, error: deliveryError } = await supabase
        .from('orders')
        .select('id')
        .eq('courier_id', profileId)
        .in('status', ['on_delivery']);

      if (deliveryError) throw deliveryError;

      // Get delivered orders today
      const { data: deliveredToday, error: deliveredError } = await supabase
        .from('orders')
        .select('id')
        .eq('courier_id', profileId)
        .eq('status', 'delivered')
        .gte('delivered_at', today.toISOString());

      if (deliveredError) throw deliveredError;

      // Get total delivered this month
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: deliveredMonth, error: monthError } = await supabase
        .from('orders')
        .select('id')
        .eq('courier_id', profileId)
        .eq('status', 'delivered')
        .gte('delivered_at', firstOfMonth.toISOString());

      if (monthError) throw monthError;

      return {
        assigned: assignedOrders?.length || 0,
        inDelivery: inDeliveryOrders?.length || 0,
        deliveredToday: deliveredToday?.length || 0,
        deliveredMonth: deliveredMonth?.length || 0,
      };
    },
    enabled: !!profileId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCourierActiveOrders() {
  const { profileId } = useAuth();

  return useQuery({
    queryKey: ['courier-active-orders', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, 
            product_name, 
            quantity,
            products (image_url)
          ),
          order_addresses (
            recipient_name,
            phone,
            address,
            landmark,
            domiciles (name, city)
          ),
          buyer_profiles (full_name, phone)
        `)
        .eq('courier_id', profileId)
        .in('status', ['assigned', 'on_delivery'])
        .order('assigned_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });
}

export function useCourierOrderHistory() {
  const { profileId } = useAuth();

  return useQuery({
    queryKey: ['courier-order-history', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, 
            product_name, 
            quantity,
            products (image_url)
          ),
          order_addresses (
            recipient_name,
            address,
            domiciles (name)
          ),
          buyer_profiles (full_name)
        `)
        .eq('courier_id', profileId)
        .in('status', ['delivered', 'cancelled', 'failed', 'returned'])
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });
}
