import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCourierProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['courier-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('courier_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useAvailableOrders() {
  return useQuery({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          notes,
          order_items (id, product_name, quantity),
          order_addresses (
            recipient_name,
            domicile_id,
            domiciles:domicile_id (name)
          )
        `)
        .eq('status', 'paid')
        .is('courier_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useActiveOrders(courierId: string | undefined) {
  return useQuery({
    queryKey: ['active-orders', courierId],
    queryFn: async () => {
      if (!courierId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          assigned_at,
          notes,
          order_items (id, product_name, quantity),
          order_addresses (
            recipient_name,
            phone,
            address,
            landmark,
            notes,
            domiciles:domicile_id (name)
          )
        `)
        .eq('courier_id', courierId)
        .in('status', ['assigned', 'picked_up', 'on_delivery'])
        .order('assigned_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!courierId,
  });
}

export function useOrderHistory(courierId: string | undefined) {
  return useQuery({
    queryKey: ['order-history', courierId],
    queryFn: async () => {
      if (!courierId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          delivered_at,
          order_items (id, product_name, quantity),
          order_addresses (
            recipient_name,
            domiciles:domicile_id (name)
          )
        `)
        .eq('courier_id', courierId)
        .in('status', ['delivered', 'failed', 'returned'])
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!courierId,
  });
}
