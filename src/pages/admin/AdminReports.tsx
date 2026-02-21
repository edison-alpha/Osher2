import { useState } from 'react';
import { useAdminReports } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Users,
  Truck,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

const statusLabels: Record<string, string> = {
  new: 'Baru',
  waiting_payment: 'Menunggu Bayar',
  paid: 'Dibayar',
  assigned: 'Ditugaskan',
  picked_up: 'Diambil',
  on_delivery: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function AdminReports() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('30d');
  const { data: reports, isLoading } = useAdminReports(period);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Penjualan') || entry.name.includes('Revenue') 
                ? formatCurrencyFull(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Laporan & Analytics</h2>
          <p className="text-base text-gray-600">Ringkasan performa bisnis Anda</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[200px] rounded-full border-gray-200">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Hari Terakhir</SelectItem>
            <SelectItem value="30d">30 Hari Terakhir</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Penjualan</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{formatCurrencyFull(reports?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {reports?.revenueGrowth || 0}% dari periode sebelumnya
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DEF6FE', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Pesanan</CardTitle>
            <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-cyan-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{reports?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600 mt-3">
              {reports?.completedOrders || 0} selesai, {reports?.cancelledOrders || 0} dibatalkan
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFF4E6', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Rata-rata Order</CardTitle>
            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{formatCurrencyFull(reports?.averageOrderValue || 0)}</div>
            <p className="text-xs text-gray-600 mt-3">Per transaksi</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Pembeli Aktif</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{reports?.activeBuyers || 0}</div>
            <p className="text-xs text-gray-600 mt-3">Melakukan pembelian</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full bg-gray-100 p-1">
          <TabsTrigger value="sales" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Penjualan</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Pesanan</TabsTrigger>
          <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Produk</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue Trend */}
            <Card className="lg:col-span-2 border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Trend Penjualan</CardTitle>
                <CardDescription className="text-gray-500">Penjualan harian dalam periode yang dipilih</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reports?.dailySales || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        stroke="#9ca3af"
                        tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: idLocale })}
                      />
                      <YAxis 
                        className="text-xs"
                        stroke="#9ca3af"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Penjualan"
                        stroke="#6366f1" 
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Category */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Penjualan per Kategori</CardTitle>
                <CardDescription className="text-gray-500">Distribusi penjualan berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports?.salesByCategory || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {(reports?.salesByCategory || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Produk Terlaris</CardTitle>
                <CardDescription className="text-gray-500">5 produk dengan penjualan tertinggi</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={reports?.topProducts || []} 
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" className="text-xs" stroke="#9ca3af" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        className="text-xs"
                        stroke="#9ca3af"
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="quantity" 
                        name="Terjual"
                        fill="#6366f1" 
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Orders Trend */}
            <Card className="lg:col-span-2 border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Trend Pesanan</CardTitle>
                <CardDescription className="text-gray-500">Jumlah pesanan harian</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reports?.dailySales || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        stroke="#9ca3af"
                        tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: idLocale })}
                      />
                      <YAxis className="text-xs" stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        name="Pesanan"
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Status Pesanan</CardTitle>
                <CardDescription className="text-gray-500">Distribusi status pesanan saat ini</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports?.ordersByStatus || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${statusLabels[name] || name}: ${value}`}
                        labelLine={true}
                      >
                        {(reports?.ordersByStatus || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        formatter={(value) => statusLabels[value] || value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Courier Performance */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  Performa Kurir
                </CardTitle>
                <CardDescription className="text-gray-500">Jumlah pengiriman per kurir</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports?.courierPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        stroke="#9ca3af"
                        tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                      />
                      <YAxis className="text-xs" stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="deliveries" 
                        name="Pengiriman"
                        fill="#10b981" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Stock Levels */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Level Stok</CardTitle>
                <CardDescription className="text-gray-500">Distribusi level stok produk</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports?.stockLevels || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
              <CardHeader className="border-b border-gray-100 pb-5 pt-6">
                <CardTitle className="text-gray-900 text-lg font-bold">Produk Stok Rendah</CardTitle>
                <CardDescription className="text-gray-500">Produk yang perlu restock</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {reports?.lowStockProducts && reports.lowStockProducts.length > 0 ? (
                    reports.lowStockProducts.map((product, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${product.quantity <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
                            {product.quantity} unit
                          </p>
                          <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-400">Semua produk memiliki stok cukup</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
