import { useState } from 'react';
import { Package, CheckCircle, XCircle, RotateCcw, Calendar, TrendingUp, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useOrderHistory, useCourierProfile } from '@/hooks/useCourier';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  delivered: { label: 'Terkirim', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle },
  failed: { label: 'Gagal', color: 'text-red-800', bgColor: 'bg-red-100', icon: XCircle },
  returned: { label: 'Dikembalikan', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: RotateCcw },
  cancelled: { label: 'Dibatalkan', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: XCircle },
};

export default function OrderHistory() {
  const { data: profile } = useCourierProfile();
  const { data: orders, isLoading } = useOrderHistory(profile?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and search orders
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_addresses?.[0]?.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const deliveredCount = orders?.filter(o => o.status === 'delivered').length || 0;
  const failedCount = orders?.filter(o => o.status === 'failed' || o.status === 'returned').length || 0;
  const successRate = orders?.length ? Math.round((deliveredCount / orders.length) * 100) : 0;

  if (isLoading) {
    return <LoadingScreen variant="courier" />;
  }

  return (
    <CourierLayout>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111111]">Riwayat Pengiriman</h1>
        <p className="text-[13px] text-[#8E8E93] mt-1">Total {orders?.length || 0} pengiriman</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl p-3 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-xl font-bold text-green-900">{deliveredCount}</p>
          </div>
          <p className="text-[10px] text-green-700 font-medium">Sukses</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-3xl p-3 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-xl font-bold text-red-900">{failedCount}</p>
          </div>
          <p className="text-[10px] text-red-700 font-medium">Gagal</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-3 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-xl font-bold text-blue-900">{successRate}%</p>
          </div>
          <p className="text-[10px] text-blue-700 font-medium">Tingkat Sukses</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
          <Input
            placeholder="Cari order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full h-11 text-sm border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-full h-11 text-sm border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="delivered">Terkirim</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
            <SelectItem value="returned">Dikembalikan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-[#111111] mb-2">
            {orders?.length === 0 ? 'Belum Ada Riwayat' : 'Tidak Ditemukan'}
          </h3>
          <p className="text-[#8E8E93] text-center text-xs max-w-xs">
            {orders?.length === 0 
              ? 'Riwayat pengiriman Anda akan muncul di sini'
              : 'Coba ubah kata kunci pencarian atau filter'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders?.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.delivered;
            const StatusIcon = status.icon;
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;
            const firstItem = order.order_items?.[0];
            const itemCount = order.order_items?.length || 0;
            const productImage = firstItem?.products?.image_url;

            return (
              <div 
                key={order.id} 
                className="overflow-hidden animate-fade-in hover:shadow-md transition-shadow bg-white rounded-3xl shadow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        status.bgColor
                      )}>
                        <StatusIcon className={cn("w-4 h-4", status.color)} />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold text-[#111111]">{order.order_number}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#8E8E93]">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(order.delivered_at || order.created_at)}</span>
                          <span>•</span>
                          <span>{formatTime(order.delivered_at || order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={cn(status.bgColor, status.color, "text-[9px] px-2.5 py-1 rounded-full font-semibold")}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Product Preview */}
                  {firstItem && (
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={firstItem.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#111111] truncate">{firstItem.product_name}</p>
                        <p className="text-[10px] text-[#8E8E93]">x{firstItem.quantity}</p>
                        {itemCount > 1 && (
                          <p className="text-[9px] text-blue-600 mt-0.5">+{itemCount - 1} produk lainnya</p>
                        )}
                      </div>
                      <p className="font-bold text-sm text-[#111111]">{formatPrice(order.total)}</p>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs text-[#111111] truncate">{address?.recipient_name}</p>
                      <p className="text-[10px] text-[#8E8E93] truncate">{(domicile as any)?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CourierLayout>
  );
}
