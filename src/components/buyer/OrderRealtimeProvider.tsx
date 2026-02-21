import { useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, CreditCard, XCircle, Clock } from 'lucide-react';

const statusLabels: Record<string, { label: string; icon: typeof Package }> = {
  new: { label: 'Pesanan baru dibuat', icon: Package },
  waiting_payment: { label: 'Menunggu pembayaran', icon: Clock },
  paid: { label: 'Pembayaran dikonfirmasi', icon: CreditCard },
  assigned: { label: 'Kurir telah ditugaskan', icon: Truck },
  on_delivery: { label: 'Pesanan dalam pengantaran', icon: Truck },
  delivered: { label: 'Pesanan telah diterima', icon: CheckCircle },
  cancelled: { label: 'Pesanan dibatalkan', icon: XCircle },
  refunded: { label: 'Dana dikembalikan', icon: CreditCard },
  failed: { label: 'Pengiriman gagal', icon: XCircle },
  returned: { label: 'Pesanan dikembalikan', icon: Package },
};

interface OrderRealtimeProviderProps {
  children: ReactNode;
}

export function OrderRealtimeProvider({ children }: OrderRealtimeProviderProps) {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!profileId) return;

    // Subscribe to order status changes
    const channel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${profileId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          const orderNumber = payload.new?.order_number;

          // Only show notification if status actually changed
          if (newStatus && oldStatus && newStatus !== oldStatus) {
            const statusInfo = statusLabels[newStatus] || { label: 'Status diperbarui', icon: Package };
            const StatusIcon = statusInfo.icon;

            toast({
              title: `Pesanan ${orderNumber}`,
              description: statusInfo.label,
              duration: 5000,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
            queryClient.invalidateQueries({ queryKey: ['buyer-order-detail'] });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [profileId, queryClient]);

  return <>{children}</>;
}
