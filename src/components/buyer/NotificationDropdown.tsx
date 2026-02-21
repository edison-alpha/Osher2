import { useState } from 'react';
import { Bell, Package, Truck, CheckCircle, X, Clock, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'delivery' | 'system';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: Date;
  isRead: boolean;
}

// Dummy notifications data
const dummyNotifications: Notification[] = [
  {
    id: '1',
    type: 'delivery',
    title: 'Pesanan Diterima',
    message: 'Pesanan #ORD-2024-001 telah diterima. Terima kasih!',
    orderId: 'payout-dummy-1', // Use actual order ID format from your database
    orderNumber: 'ORD-2024-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
  },
  {
    id: '2',
    type: 'order',
    title: 'Pesanan Sedang Dikirim',
    message: 'Pesanan #ORD-2024-002 sedang dalam perjalanan ke alamat Anda',
    orderId: 'payout-dummy-2',
    orderNumber: 'ORD-2024-002',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: false,
  },
  {
    id: '3',
    type: 'payment',
    title: 'Pembayaran Dikonfirmasi',
    message: 'Pembayaran untuk pesanan #ORD-2024-003 telah dikonfirmasi',
    orderId: 'payout-dummy-3',
    orderNumber: 'ORD-2024-003',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
  },
  {
    id: '4',
    type: 'order',
    title: 'Pesanan Diproses',
    message: 'Pesanan #ORD-2024-004 sedang diproses oleh penjual',
    orderId: 'payout-dummy-4',
    orderNumber: 'ORD-2024-004',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'Promo Spesial!',
    message: 'Dapatkan diskon 20% untuk pembelian minimal Rp 100.000',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
  },
];

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'delivery':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50';
      case 'payment':
        return 'bg-green-50';
      case 'delivery':
        return 'bg-purple-50';
      case 'system':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} menit yang lalu`;
    } else if (hours < 24) {
      return `${hours} jam yang lalu`;
    } else if (days < 7) {
      return `${days} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    // Close the sheet
    setIsOpen(false);

    // Navigate based on notification type
    if (notification.orderId) {
      // Navigate to order detail
      navigate(`/buyer/orders/${notification.orderId}`);
    } else if (notification.type === 'system') {
      // For system notifications, you can navigate to catalog or stay
      // navigate('/buyer/catalog');
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
          <Bell className="h-[22px] w-[22px] text-slate-700" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[32px] h-auto max-h-[85vh] px-0 pb-0 bg-[#F9F9F9]">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-gray-300 mb-5 mt-2" />
        
        {/* Header */}
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[#111111]">Notifikasi</h2>
            {unreadCount > 0 && notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#111111] font-medium active:opacity-60 transition-opacity"
              >
                Tandai Semua
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-[#8E8E93]">{unreadCount} notifikasi baru</p>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-130px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-[#111111] mb-1">Tidak Ada Notifikasi</p>
              <p className="text-sm text-[#8E8E93]">Notifikasi Anda akan muncul di sini</p>
            </div>
          ) : (
            <div className="px-4 space-y-2 pb-4">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]",
                    notification.isRead
                      ? "bg-white"
                      : "bg-white shadow-sm",
                    notification.orderId && "cursor-pointer"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                      getNotificationBg(notification.type)
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={cn(
                          "text-sm leading-tight",
                          notification.isRead 
                            ? "font-medium text-[#111111]" 
                            : "font-semibold text-[#111111]"
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#111111]" />
                          )}
                          {notification.orderId && (
                            <svg className="w-4 h-4 text-[#8E8E93]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed line-clamp-2 mb-1",
                        notification.isRead ? "text-[#8E8E93]" : "text-gray-700"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#8E8E93] font-normal">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 pt-3 pb-4 bg-[#F9F9F9]">
            <button
              onClick={clearAll}
              className="w-full py-3 bg-white rounded-xl text-sm font-medium text-red-600 active:opacity-60 transition-opacity"
            >
              Hapus Semua Notifikasi
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
