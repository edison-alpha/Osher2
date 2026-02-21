import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AdminRealtimeProviderProps {
  children: React.ReactNode;
}

export function AdminRealtimeProvider({ children }: AdminRealtimeProviderProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-updates')
      // New orders
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          toast({
            title: '📦 Pesanan Baru!',
            description: `Order ${payload.new.order_number} masuk`,
          });

          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      // Payment confirmations
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_confirmations',
        },
        (payload) => {
          toast({
            title: '💳 Konfirmasi Pembayaran Baru',
            description: 'Ada pembayaran yang perlu dikonfirmasi',
          });

          queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
          queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
        }
      )
      // Order status changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newStatus = payload.new.status as string;
          const oldStatus = payload.old?.status as string;

          if (newStatus !== oldStatus) {
            if (newStatus === 'delivered') {
              toast({
                title: '✅ Order Terkirim',
                description: `Order ${payload.new.order_number} telah diterima`,
              });
            } else if (newStatus === 'cancelled') {
              toast({
                title: '❌ Order Dibatalkan',
                description: `Order ${payload.new.order_number} dibatalkan`,
                variant: 'destructive',
              });
            }

            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          }
        }
      )
      // Payout requests
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payout_requests',
        },
        (payload) => {
          toast({
            title: '💰 Permintaan Pencairan Baru',
            description: 'Ada permintaan pencairan komisi yang perlu diproses',
          });

          queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  return <>{children}</>;
}
