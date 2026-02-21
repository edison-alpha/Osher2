import {
  DollarSign,
  ShoppingCart,
  Package,
  Box,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Truck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboardStats, useAdminOrders } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

const statusColors: Record<string, string> = {
  new: 'bg-info text-info-foreground',
  waiting_payment: 'bg-warning text-warning-foreground',
  paid: 'bg-success text-success-foreground',
  assigned: 'bg-primary text-primary-foreground',
  on_delivery: 'bg-accent text-accent-foreground',
  delivered: 'bg-success text-success-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const statusLabels: Record<string, string> = {
  new: 'Baru',
  waiting_payment: 'Menunggu Bayar',
  paid: 'Dibayar',
  assigned: 'Ditugaskan',
  on_delivery: 'Dalam Pengantaran',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useAdminOrders();

  const quickActions = [
    {
      title: 'Tambah Produk',
      description: 'Buat produk baru di katalog',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      path: '/admin/products'
    },
    {
      title: 'Update Stok',
      description: 'Tambah atau kurangi stok',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      path: '/admin/inventory'
    },
    {
      title: 'Kelola Pesanan',
      description: 'Lihat dan assign kurir',
      icon: ShoppingCart,
      color: 'bg-amber-50 text-amber-600',
      path: '/admin/orders'
    },
    {
      title: 'Lihat Laporan',
      description: 'Analytics & insights',
      icon: Activity,
      color: 'bg-emerald-50 text-emerald-600',
      path: '/admin/reports'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Selamat Datang di Dashboard Admin</h2>
        <p className="text-base text-gray-600">Kelola bisnis retail Anda dengan mudah dan efisien</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Penjualan</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalSalesToday || 0)}</div>
                <div className="flex items-center gap-1 mt-3">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-600">Hari ini</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Pesanan Baru</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{stats?.newOrdersCount || 0}</div>
                <p className="text-xs text-gray-600 mt-3">Menunggu konfirmasi</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFE6E7', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Produk Aktif</CardTitle>
            <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Package className="h-6 w-6 text-pink-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{stats?.activeProductsCount || 0}</div>
                <p className="text-xs text-gray-600 mt-3">Tersedia di katalog</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DEF6FE', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Stok Rendah</CardTitle>
            <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Box className="h-6 w-6 text-cyan-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{stats?.lowStockCount || 0}</div>
                <p className="text-xs text-gray-600 mt-3">Perlu restok</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recent Orders - Takes 2 columns */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-5 pt-6">
            <div>
              <CardTitle className="text-gray-900 text-lg font-bold">Pesanan Terbaru</CardTitle>
              <CardDescription className="text-gray-500 mt-1 text-sm">5 pesanan terakhir yang masuk</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full bg-gray-900 hover:bg-gray-800 text-white font-medium px-4"
              onClick={() => navigate('/admin/orders')}
            >
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => {
                  // Get first product image from order items
                  const firstProduct = order.order_items?.[0]?.product;
                  const productImage = firstProduct?.image_url;
                  const productName = firstProduct?.name;
                  const itemCount = order.order_items?.length || 0;

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border border-gray-100/50 group"
                      onClick={() => navigate('/admin/orders')}
                    >
                      <div className="flex items-center gap-4">
                        {productImage ? (
                          <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <img
                              src={productImage}
                              alt={productName || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{order.order_number}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.buyer?.full_name || 'Unknown'} • {itemCount} item{itemCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">{formatCurrency(Number(order.total))}</p>
                        <div className="flex items-center gap-2 mt-1.5 justify-end">
                          <Badge className={cn("rounded-full text-xs px-3 py-1 font-medium", statusColors[order.status])}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Belum ada pesanan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Takes 1 column */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
          <CardHeader className="border-b border-gray-100 pb-5 pt-6">
            <CardTitle className="text-gray-900 text-lg font-bold">Aksi Cepat</CardTitle>
            <CardDescription className="text-gray-500 mt-1 text-sm">Shortcut untuk tugas umum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6 pb-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all text-left group border border-gray-100/50"
              >
                <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
