import { useEffect, useState } from 'react';
import { Bell, Package, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'assigned' | 'updated';
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  timestamp: Date;
  read: boolean;
}

export function CourierNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profileId } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!profileId) return;

    // Subscribe to order updates for this courier
    const ordersChannel = supabase
      .channel('courier-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `courier_id=eq.${profileId}`,
        },
        async (payload) => {
          console.log('Order update received:', payload);
          const updatedOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          // Check if this order was just assigned to this courier
          if (oldOrder.courier_id !== profileId && updatedOrder.courier_id === profileId) {
            // Fetch buyer info
            const { data: buyer } = await supabase
              .from('buyer_profiles')
              .select('full_name')
              .eq('id', updatedOrder.buyer_id)
              .single();
            
            // Fetch address
            const { data: address } = await supabase
              .from('order_addresses')
              .select('address, domiciles(name)')
              .eq('order_id', updatedOrder.id)
              .single();
            
            const notification: Notification = {
              id: `assigned-${updatedOrder.id}-${Date.now()}`,
              type: 'assigned',
              title: '🚚 Pesanan Baru Ditugaskan!',
              message: `${updatedOrder.order_number} - ${buyer?.full_name || 'Buyer'}\n${(address?.domiciles as any)?.name || address?.address || ''}`,
              orderId: updatedOrder.id,
              orderNumber: updatedOrder.order_number,
              timestamp: new Date(),
              read: false,
            };
            
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            
            // Show toast notification with sound effect
            toast.success('Pesanan Baru Ditugaskan!', {
              description: `${updatedOrder.order_number} siap untuk diambil`,
              duration: 10000,
              action: {
                label: 'Lihat',
                onClick: () => navigate('/courier/active'),
              },
            });
            
            // Play notification sound
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBlP2OmLZWBxj7Onr6ZjOytipN3jy4U0HHHHzLiMZz0vXqTW366RXC4wZ6LZ3LJtIx5Zq9bZrWshKWu3zaxtIh1lqtXZq2kfJWqy0s2qZR0jZq/P0KlkHCNlrczQp2MbImOqyc+mYRoiYqjHz6VgGSFgpcTOo18YIF6jw82iXhcfXKDBzKFdFh5boL/MoFsVHVmdvc2fWhQcWJu7zp1ZExtat7rOnVgSGliduc6cVxEYVpm3zpxWEBdUmLbPm1UPFlOWtc+aVA4VUpS0z5lTDRRQkrPOmFINE06Rs86XUQwTTY+yzpdQCxJLjrHNllAKEUqNsM2VTwkQSYuvzZROCBBIiq7Mk04HEEeJrc2TTgYPRoiszpNNBg9Fh6vNkk0FD0OGqs2RTQQOQ4WpzZFNAw5ChKnNkE0DDUKDqM2QTQINQYO');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {
              console.log('Could not play notification sound');
            }
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['courier-orders'] });
            queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [profileId, queryClient, navigate]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    navigate('/courier/active');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8">
                  Tandai Dibaca
                </Button>
                <Button variant="ghost" size="icon" onClick={clearAll} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Tidak ada notifikasi</p>
              <p className="text-xs mt-1">Pesanan baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      notification.type === 'assigned' 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {notification.type === 'assigned' ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
