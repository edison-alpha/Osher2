import { useEffect, useState, useRef } from 'react';
import { Bell, Package, CreditCard, X, Volume2, VolumeX } from 'lucide-react';
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
import { useFloatingNotification } from './FloatingNotificationContainer';

interface Notification {
  id: string;
  type: 'new_order' | 'new_payment';
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  timestamp: Date;
  read: boolean;
}

export function OrderNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage on mount
    try {
      const saved = localStorage.getItem('admin-notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects and filter old ones
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return parsed
          .map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }))
          .filter((n: Notification) => n.timestamp > sevenDaysAgo);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    return [];
  });
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showNotification } = useFloatingNotification();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('admin-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  // Auto-delete notifications older than 7 days
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      setNotifications(prev => 
        prev.filter(notification => notification.timestamp > sevenDaysAgo)
      );
    }, 1000 * 60 * 60); // Check every hour

    // Initial cleanup on mount
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    setNotifications(prev => 
      prev.filter(notification => notification.timestamp > sevenDaysAgo)
    );

    return () => clearInterval(cleanupInterval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (title: string, body: string, type: 'new_order' | 'new_payment') => {
    if (notificationPermission !== 'granted') return;
    
    try {
      const notification = new Notification(title, {
        body,
        icon: type === 'new_order' ? '/pwa-192x192.png' : '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `admin-${type}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        if (type === 'new_order') {
          navigate('/admin/orders');
        } else {
          navigate('/admin/payments');
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  useEffect(() => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('New order received:', payload);
          const newOrder = payload.new as any;
          
          // Fetch buyer info
          const { data: buyer } = await supabase
            .from('buyer_profiles')
            .select('full_name')
            .eq('id', newOrder.buyer_id)
            .single();
          
          const notification: Notification = {
            id: `order-${newOrder.id}`,
            type: 'new_order',
            title: 'Pesanan Baru!',
            message: `${buyer?.full_name || 'Buyer'} membuat pesanan ${newOrder.order_number}`,
            orderId: newOrder.id,
            orderNumber: newOrder.order_number,
            timestamp: new Date(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          
          // Play sound
          playNotificationSound();
          
          // Show floating notification (iOS style)
          showNotification({
            type: 'new_order',
            title: 'Pesanan Baru!',
            message: notification.message,
            orderNumber: newOrder.order_number,
            buyerName: buyer?.full_name,
            buyerImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${buyer?.full_name || 'buyer'}`,
            onClick: () => navigate('/admin/orders'),
          });
          
          // Show browser notification
          showBrowserNotification(
            '📦 Pesanan Baru!',
            notification.message,
            'new_order'
          );
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .subscribe();

    // Subscribe to new payment confirmations
    const paymentsChannel = supabase
      .channel('admin-payments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_confirmations',
        },
        async (payload) => {
          console.log('New payment received:', payload);
          const newPayment = payload.new as any;
          
          // Fetch order info
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, buyer_id, buyer_profiles(full_name)')
            .eq('id', newPayment.order_id)
            .single();
          
          const buyerProfile = order?.buyer_profiles as any;
          
          const notification: Notification = {
            id: `payment-${newPayment.id}`,
            type: 'new_payment',
            title: 'Bukti Pembayaran Baru!',
            message: `${buyerProfile?.full_name || 'Buyer'} mengunggah bukti pembayaran untuk ${order?.order_number}`,
            orderId: newPayment.order_id,
            orderNumber: order?.order_number || '',
            timestamp: new Date(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          
          // Play sound
          playNotificationSound();
          
          // Show floating notification (iOS style)
          showNotification({
            type: 'new_payment',
            title: 'Bukti Pembayaran Baru!',
            message: notification.message,
            orderNumber: order?.order_number || '',
            buyerName: buyerProfile?.full_name,
            buyerImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${buyerProfile?.full_name || 'buyer'}`,
            productImage: newPayment.payment_proof_url,
            onClick: () => navigate('/admin/payments'),
          });
          
          // Show browser notification
          showBrowserNotification(
            '💳 Bukti Pembayaran Baru!',
            notification.message,
            'new_payment'
          );
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
          queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [queryClient, navigate, soundEnabled, notificationPermission]);

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
    
    if (notification.type === 'new_order') {
      navigate('/admin/orders');
    } else if (notification.type === 'new_payment') {
      navigate('/admin/payments');
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-gray-200 rounded-full">
          <Bell className={`w-5 h-5 text-gray-900 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] p-0 flex items-center justify-center text-[10px] font-bold animate-bounce"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 shadow-xl border-gray-200 rounded-[32px] overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900">Notifikasi</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-7 w-7 hover:bg-gray-100 rounded-full"
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-600" />
              )}
            </Button>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="h-7 px-2 text-[11px] font-semibold hover:bg-gray-100 rounded-full text-gray-600"
              >
                Tandai Dibaca
              </Button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Tidak ada notifikasi</p>
              <p className="text-xs text-gray-500 text-center">Notifikasi akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      notification.type === 'new_order' 
                        ? 'bg-blue-500' 
                        : 'bg-green-500'
                    }`}>
                      {notification.type === 'new_order' ? (
                        <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
                      ) : (
                        <CreditCard className="w-5 h-5 text-white" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <p className="text-[12px] text-gray-600 leading-snug line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notification.type === 'new_order'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {notification.orderNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={() => setOpen(false)}
              className="w-full text-center text-[11px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
