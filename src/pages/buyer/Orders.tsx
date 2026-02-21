import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Package,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  XCircle,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Upload,
  ShoppingBag
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FloatingNav } from '@/components/buyer/FloatingNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type OrderStatus = 'all' | 'unpaid' | 'processing' | 'completed';

interface OrderCategory {
  key: OrderStatus;
  label: string;
  count?: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Package; dotColor: string; step: number }> = {
  new: { label: 'Baru', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Package, dotColor: 'bg-gray-400', step: 0 },
  waiting_payment: { label: 'Menunggu Bayar', color: 'text-orange-500', bgColor: 'bg-orange-100', icon: Clock, dotColor: 'bg-orange-400', step: 0 },
  paid: { label: 'Dibayar', color: 'text-blue-500', bgColor: 'bg-blue-100', icon: CreditCard, dotColor: 'bg-blue-400', step: 1 },
  assigned: { label: 'Siap Dikirim', color: 'text-indigo-500', bgColor: 'bg-indigo-100', icon: Package, dotColor: 'bg-indigo-400', step: 2 },
  on_delivery: { label: 'Dalam Pengantaran', color: 'text-cyan-500', bgColor: 'bg-cyan-100', icon: Truck, dotColor: 'bg-cyan-400', step: 2 },
  delivered: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, dotColor: 'bg-green-400', step: 3 },
  cancelled: { label: 'Dibatalkan', color: 'text-red-500', bgColor: 'bg-red-100', icon: XCircle, dotColor: 'bg-red-400', step: -1 },
  refunded: { label: 'Refund', color: 'text-amber-500', bgColor: 'bg-amber-100', icon: RotateCcw, dotColor: 'bg-amber-400', step: -1 },
  failed: { label: 'Gagal', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, dotColor: 'bg-red-500', step: -1 },
  returned: { label: 'Retur', color: 'text-stone-500', bgColor: 'bg-stone-100', icon: RotateCcw, dotColor: 'bg-stone-400', step: -1 },
};

// Status flow steps for processing orders
const statusFlowSteps = [
  { key: 'paid', label: 'Diproses', icon: CreditCard },
  { key: 'assigned', label: 'Dikirim', icon: Truck },
  { key: 'delivered', label: 'Selesai', icon: CheckCircle },
];

interface StatusFlowProps {
  currentStatus: string;
}

function StatusFlow({ currentStatus }: StatusFlowProps) {
  const currentStep = statusConfig[currentStatus]?.step || 0;

  // Only show flow for processing orders (step 1-3)
  if (currentStep < 1 || currentStep > 3) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-50">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute left-0 right-0 top-[10px] h-[2px] bg-gray-100 mx-4" />

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-[10px] h-[2px] bg-[#111111] mx-4 transition-all duration-500"
          style={{
            width: `calc(${Math.min((currentStep - 1) / 2 * 100, 100)}% - 32px)`
          }}
        />

        {statusFlowSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep >= stepNumber;
          const isCurrent = currentStep === stepNumber;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                isActive ? "bg-[#111111]" : "bg-gray-200",
                isCurrent && "ring-2 ring-[#111111] ring-offset-1"
              )}>
                <StepIcon className={cn(
                  "w-2.5 h-2.5",
                  isActive ? "text-white" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "text-[8px] mt-1 font-medium",
                isActive ? "text-[#111111]" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<OrderStatus>('all');

  const { data: orders, isLoading, isRefetching } = useQuery({
    queryKey: ['buyer-orders', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          order_items (id, product_name, quantity, products (image_url)),
          payment_confirmations (id, is_confirmed)
        `)
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['buyer-orders', profileId] });
  };

  // Group orders by status
  const groupedOrders = useMemo(() => {
    if (!orders) return { unpaid: [], processing: [], completed: [], all: [] };

    const unpaid = orders.filter(o =>
      (o.status === 'new' || o.status === 'waiting_payment') &&
      (!o.payment_confirmations || o.payment_confirmations.length === 0)
    );

    const processing = orders.filter(o =>
      ['paid', 'assigned', 'on_delivery'].includes(o.status) ||
      ((o.status === 'new' || o.status === 'waiting_payment') && o.payment_confirmations && o.payment_confirmations.length > 0)
    );

    const completed = orders.filter(o =>
      ['delivered', 'cancelled', 'refunded', 'failed', 'returned'].includes(o.status)
    );

    return { unpaid, processing, completed, all: orders };
  }, [orders]);

  const categories: OrderCategory[] = [
    { key: 'all', label: 'Semua', count: groupedOrders.all.length },
    { key: 'unpaid', label: 'Belum Bayar', count: groupedOrders.unpaid.length },
    { key: 'processing', label: 'Diproses', count: groupedOrders.processing.length },
    { key: 'completed', label: 'Selesai', count: groupedOrders.completed.length },
  ];

  const displayedOrders = groupedOrders[activeFilter];

  const OrderCard = ({ order, showPaymentAction = false }: { order: any; showPaymentAction?: boolean }) => {
    const status = statusConfig[order.status] || statusConfig.new;
    const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const firstItem = order.order_items?.[0];
    const productImage = firstItem?.products?.image_url;

    // Get badge style based on status - Shopee style (soft pastel)
    const getBadgeStyle = () => {
      switch (order.status) {
        case 'delivered':
          return {
            bg: 'bg-green-100',
            text: 'text-green-600',
            icon: CheckCircle
          };
        case 'cancelled':
          return {
            bg: 'bg-red-100',
            text: 'text-red-500',
            icon: XCircle
          };
        case 'failed':
          return {
            bg: 'bg-red-100',
            text: 'text-red-600',
            icon: AlertCircle
          };
        case 'new':
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            icon: Package
          };
        case 'waiting_payment':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-500',
            icon: Clock
          };
        case 'paid':
          return {
            bg: 'bg-blue-100',
            text: 'text-blue-500',
            icon: CreditCard
          };
        case 'assigned':
          return {
            bg: 'bg-indigo-100',
            text: 'text-indigo-500',
            icon: Package
          };
        case 'on_delivery':
          return {
            bg: 'bg-cyan-100',
            text: 'text-cyan-500',
            icon: Truck
          };
        case 'refunded':
          return {
            bg: 'bg-amber-100',
            text: 'text-amber-500',
            icon: RotateCcw
          };
        case 'returned':
          return {
            bg: 'bg-stone-100',
            text: 'text-stone-500',
            icon: RotateCcw
          };
        default:
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-500',
            icon: Package
          };
      }
    };

    const badgeStyle = getBadgeStyle();
    const BadgeIcon = badgeStyle.icon;

    return (
      <Link
        to={`/buyer/orders/${order.id}`}
        className="block"
      >
        <div className={cn(
          "relative bg-white border border-gray-100 rounded-xl p-2.5 transition-all duration-200 active:scale-[0.99] overflow-hidden",
          showPaymentAction ? "border-amber-200 bg-amber-50/20" : "hover:border-gray-200 hover:shadow-sm"
        )}>
          {/* Status Badge - Top Right Corner - Shopee Style */}
          <div className="absolute top-2 right-2 z-10">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
              badgeStyle.bg,
              badgeStyle.text
            )}>
              <BadgeIcon className={cn("w-3 h-3", badgeStyle.text)} />
              {status.label}
            </div>
          </div>

          {/* Header: Order Number */}
          <div className="flex items-center mb-2">
            <span className="text-[9px] text-[#8E8E93]">{order.order_number}</span>
          </div>

          {/* Compact Single Row Layout */}
          <div className="flex items-center gap-2.5">
            {/* Product Image - Smaller */}
            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
              {productImage ? (
                <img
                  src={productImage}
                  alt={firstItem?.product_name || 'Product'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239CA3AF%22 stroke-width=%221.5%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3Ccircle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/%3E%3Cpath d=%22m21 15-5-5L5 21%22/%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>

            {/* Product Info - Compact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {firstItem && (
                  <p className="text-[11px] text-[#111111] font-medium truncate leading-tight">
                    {firstItem.product_name}
                  </p>
                )}
                {itemCount > 1 && (
                  <span className="text-[10px] text-[#8E8E93] shrink-0">+{itemCount - 1}</span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-[#111111] mt-0.5">
                {formatPrice(order.total)}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </div>

          {/* Status Flow for Processing Orders */}
          <StatusFlow currentStatus={order.status} />

          {/* Action Button for Unpaid Orders - Transparent Style */}
          {showPaymentAction && (
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/buyer/orders/${order.id}`;
                }}
                className="bg-[#111111]/90 hover:bg-[#111111] text-white px-4 py-2 rounded-full text-[10px] font-medium flex items-center gap-1.5 transition-all active:scale-95 backdrop-blur-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Bayar Sekarang
              </button>
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 pb-2" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-[#111111]">Pesanan Saya</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <RefreshCw className={cn("w-[18px] h-[18px] text-[#111111]", isRefetching && "animate-spin")} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  activeFilter === cat.key
                    ? "bg-[#111111] text-white shadow-sm"
                    : "bg-gray-100 text-[#8E8E93] hover:bg-gray-200"
                )}
              >
                {cat.label}
                {cat.count !== undefined && cat.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0 rounded-full",
                    activeFilter === cat.key ? "bg-white/20" : "bg-white/60"
                  )}>
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pt-3">

          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-semibold text-[#111111] mb-1">Belum Ada Pesanan</h2>
              <p className="text-xs text-[#8E8E93] text-center mb-6 max-w-xs">
                Mulai belanja untuk melihat pesanan Anda
              </p>
              <Link to="/buyer/catalog">
                <button className="bg-[#111111] text-white px-5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-transform active:scale-95">
                  <ShoppingBag className="w-4 h-4" />
                  Mulai Belanja
                </button>
              </Link>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ClipboardList className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-[#8E8E93] text-center">
                Tidak ada pesanan dalam kategori ini
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showPaymentAction={groupedOrders.unpaid.some(o => o.id === order.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <FloatingNav />
    </div>
  );
}
