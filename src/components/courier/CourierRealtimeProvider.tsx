import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Package, Truck, CheckCircle } from 'lucide-react';

const statusLabels: Record<string, { label: string; icon: typeof Package }> = {
  assigned: { label: 'Order baru ditugaskan', icon: Truck },
  picked_up: { label: 'Order siap diantar', icon: Package },
  delivered: { label: 'Order terkirim', icon: CheckCircle },
};

interface CourierRealtimeProviderProps {
  children: React.ReactNode;
}

export function CourierRealtimeProvider({ children }: CourierRealtimeProviderProps) {
  const { profileId, isCourier } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profileId || !isCourier) return;

    const channel = supabase
      .channel('courier-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `courier_id=eq.${profileId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as string;
          const oldStatus = payload.old?.status as string;

          if (newStatus !== oldStatus && statusLabels[newStatus]) {
            const statusInfo = statusLabels[newStatus];
            const StatusIcon = statusInfo.icon;

            toast({
              title: statusInfo.label,
              description: `Order ${payload.new.order_number}`,
            });
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
          queryClient.invalidateQueries({ queryKey: ['courier-order-history'] });
          queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Listen for orders newly assigned to this courier
          if (payload.new.courier_id === profileId && payload.old?.courier_id !== profileId) {
            toast({
              title: '🚚 Order Baru!',
              description: `Anda ditugaskan untuk order ${payload.new.order_number}`,
            });

            queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, isCourier, queryClient]);

  return <>{children}</>;
}
