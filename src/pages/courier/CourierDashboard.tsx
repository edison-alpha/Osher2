import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  ArrowRight,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCourierStats, useCourierActiveOrders } from '@/hooks/useCourierData';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { cn } from '@/lib/utils';

export default function CourierDashboard() {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCourierStats();
  const { data: activeOrders, isLoading: ordersLoading } = useCourierActiveOrders();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role && role !== 'courier') {
      if (role === 'buyer') navigate('/buyer');
      else if (['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) navigate('/admin');
    }
  }, [user, loading, role, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingScreen variant="courier" />;
  }

  return (
    <CourierLayout>
      {/* Welcome Section */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111111]">
          Dashboard
        </h1>
        <p className="text-[13px] text-[#8E8E93] mt-1">
          Kelola pengantaran pesanan Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="text-2xl font-bold text-blue-900">{stats?.assigned || 0}</div>
            )}
          </div>
          <p className="text-[10px] text-blue-700 font-medium">Ditugaskan</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="text-2xl font-bold text-orange-900">{stats?.inDelivery || 0}</div>
            )}
          </div>
          <p className="text-[10px] text-orange-700 font-medium">Dalam Antar</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="text-2xl font-bold text-green-900">{stats?.deliveredToday || 0}</div>
            )}
          </div>
          <p className="text-[10px] text-green-700 font-medium">Hari Ini</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-3xl p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              <div className="text-2xl font-bold text-purple-900">{stats?.deliveredMonth || 0}</div>
            )}
          </div>
          <p className="text-[10px] text-purple-700 font-medium">Bulan Ini</p>
        </div>
      </div>

      {/* Active Orders */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[#111111]">Pesanan Aktif</h2>
          {(activeOrders?.length || 0) > 0 && (
            <Link to="/courier/active">
              <button className="text-[#111111] text-[10px] font-semibold flex items-center gap-1">
                Lihat Semua
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          )}
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : activeOrders?.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gradient-to-br from-gray-50 to-white">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-[#111111] mb-1">Belum Ada Pesanan</h3>
            <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
              Pesanan yang ditugaskan kepada Anda akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders?.slice(0, 5).map((order: any, index: number) => {
              const address = order.order_addresses?.[0];
              const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                assigned: { label: 'Siap Diambil', color: 'text-blue-800', bgColor: 'bg-blue-100' },
                picked_up: { label: 'Diambil', color: 'text-purple-800', bgColor: 'bg-purple-100' },
                on_delivery: { label: 'Dalam Pengantaran', color: 'text-orange-800', bgColor: 'bg-orange-100' },
              };
              const status = statusConfig[order.status] || statusConfig.assigned;
              const firstItem = order.order_items?.[0];
              const itemCount = order.order_items?.length || 0;
              const productImage = firstItem?.products?.image_url;
              
              return (
                <Link 
                  key={order.id} 
                  to="/courier/active"
                  className="block animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-white rounded-3xl overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
                    {/* Header with Order Number and Status */}
                    <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-[#111111]">{order.order_number}</p>
                            <p className="text-[9px] text-[#8E8E93]">{itemCount} item</p>
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
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                            {productImage ? (
                              <img 
                                src={productImage} 
                                alt={firstItem.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
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

                      {/* Delivery Address */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-blue-700 font-semibold mb-1">Alamat Pengiriman</p>
                            <p className="text-xs font-semibold text-[#111111]">{address?.recipient_name}</p>
                            <p className="text-[10px] text-[#8E8E93] mt-0.5 line-clamp-2">{address?.address}</p>
                            {(address?.domiciles as any)?.name && (
                              <p className="text-[9px] text-[#8E8E93] mt-0.5">{(address?.domiciles as any)?.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-blue-200/50">
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <a href={`tel:${address?.phone}`} className="text-xs font-semibold text-blue-600">
                            {address?.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CourierLayout>
  );
}
