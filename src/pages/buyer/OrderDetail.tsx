import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  XCircle,
  RotateCcw,
  AlertCircle,
  ImageIcon,
  ChevronRight,
  Copy,
  Wallet
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FloatingNav } from '@/components/buyer/FloatingNav';
import { PaymentUploadForm } from '@/components/buyer/PaymentUploadForm';
import { CancelOrderDialog } from '@/components/buyer/CancelOrderDialog';
import { useAuth } from '@/hooks/useAuth';
import { useAdminBankInfo } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { getPaymentsWithSignedUrls } from '@/lib/storageUtils';

const statusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  icon: typeof Package;
  step: number;
}> = {
  new: { label: 'Baru', color: 'text-blue-600', bgColor: 'bg-blue-50', dotColor: 'bg-blue-500', icon: Package, step: 0 },
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500', icon: Clock, step: 0 },
  paid: { label: 'Pesanan Diproses', color: 'text-emerald-600', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500', icon: CreditCard, step: 1 },
  assigned: { label: 'Sedang Dikemas', color: 'text-purple-600', bgColor: 'bg-purple-50', dotColor: 'bg-purple-500', icon: Package, step: 2 },
  on_delivery: { label: 'Dalam Pengantaran', color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: 'bg-orange-500', icon: Truck, step: 2 },
  delivered: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-50', dotColor: 'bg-green-500', icon: CheckCircle, step: 3 },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500', icon: XCircle, step: -1 },
  refunded: { label: 'Dikembalikan', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500', icon: RotateCcw, step: -1 },
  failed: { label: 'Gagal', color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500', icon: AlertCircle, step: -1 },
  returned: { label: 'Dikembalikan', color: 'text-gray-600', bgColor: 'bg-gray-50', dotColor: 'bg-gray-500', icon: RotateCcw, step: -1 },
};

// Status flow steps for timeline
const statusFlowSteps = [
  { key: 'paid', label: 'Diproses', description: 'Pesanan diproses' },
  { key: 'assigned', label: 'Dikirim', description: 'Dikirim ke alamat' },
  { key: 'delivered', label: 'Selesai', description: 'Pesanan diterima' },
];

interface StatusTimelineProps {
  currentStatus: string;
  statusHistory?: any[];
}

function StatusTimeline({ currentStatus, statusHistory }: StatusTimelineProps) {
  const currentStep = statusConfig[currentStatus]?.step || 0;
  const isProcessing = currentStep >= 1 && currentStep <= 3;
  const isCompleted = currentStep === 3;
  const isCancelled = currentStep === -1;

  // Get latest status history date
  const getStatusDate = (status: string) => {
    const history = statusHistory?.find((h) => h.status === status);
    return history ? new Date(history.created_at) : null;
  };

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800">Pesanan Dibatalkan</p>
            <p className="text-xs text-red-600">Pesanan ini telah dibatalkan</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Menunggu Pembayaran</p>
            <p className="text-xs text-amber-600">Segera lakukan pembayaran</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-gray-100" />
        <div
          className="absolute left-0 top-[14px] h-[2px] bg-[#111111] transition-all duration-500"
          style={{ width: `${Math.min((currentStep - 1) / 3 * 100, 100)}%` }}
        />
        <div className="flex justify-between relative">
          {statusFlowSteps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep >= stepNumber;
            const isCurrent = currentStep === stepNumber;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                  isActive
                    ? "bg-[#111111] border-[#111111]"
                    : "bg-white border-gray-200",
                  isCurrent && "ring-4 ring-gray-100"
                )}>
                  {isActive ? (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Info */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          statusConfig[currentStatus]?.bgColor || 'bg-gray-50'
        )}>
          {(() => {
            const Icon = statusConfig[currentStatus]?.icon || Package;
            return <Icon className={cn("w-6 h-6", statusConfig[currentStatus]?.color || 'text-gray-600')} />;
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#111111]">
            {statusConfig[currentStatus]?.label || currentStatus}
          </p>
          <p className="text-sm text-[#8E8E93] mt-0.5">
            {isCompleted
              ? 'Pesanan telah diterima'
              : isProcessing
                ? statusFlowSteps.find(s => s.key === currentStatus)?.description || 'Pesanan sedang diproses'
                : 'Pesanan menunggu pembayaran'
            }
          </p>
          {getStatusDate(currentStatus) && (
            <p className="text-xs text-[#8E8E93] mt-1">
              {getStatusDate(currentStatus)?.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { profileId } = useAuth();
  const { data: bankInfo } = useAdminBankInfo();
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['buyer-order-detail', orderId],
    queryFn: async () => {
      if (!orderId || !profileId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price_at_order,
            subtotal,
            products (image_url)
          ),
          order_addresses (
            id,
            recipient_name,
            phone,
            address,
            landmark,
            notes,
            domiciles (name, city, province)
          ),
          order_status_history (
            id,
            status,
            notes,
            created_at
          ),
          courier_profiles (
            id,
            full_name,
            phone,
            vehicle_type,
            vehicle_plate
          ),
          payment_confirmations (
            id,
            amount,
            bank_name,
            account_number,
            proof_image_url,
            is_confirmed,
            transfer_date,
            created_at
          )
        `)
        .eq('id', orderId)
        .eq('buyer_id', profileId)
        .single();

      if (error) throw error;

      // Generate signed URLs for payment proofs
      if (data?.payment_confirmations) {
        const paymentsWithSignedUrls = await getPaymentsWithSignedUrls(data.payment_confirmations);
        return { ...data, payment_confirmations: paymentsWithSignedUrls };
      }

      return data;
    },
    enabled: !!orderId && !!profileId,
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="max-w-md mx-auto">
          {/* Header Skeleton */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="px-4 pt-4 space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
        <FloatingNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="max-w-md mx-auto px-4" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-base font-semibold text-[#111111] mb-1">Pesanan Tidak Ditemukan</h2>
            <p className="text-xs text-[#8E8E93] mb-4">Pesanan yang Anda cari tidak ada</p>
            <Button
              onClick={() => navigate('/buyer/orders')}
              className="bg-[#111111] hover:bg-[#333]"
            >
              Kembali
            </Button>
          </div>
        </div>
        <FloatingNav />
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.new;
  const address = order.order_addresses?.[0];
  const courier = order.courier_profiles;
  const statusHistory = order.order_status_history?.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const payment = order.payment_confirmations?.[0];

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-32">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/buyer/orders')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#111111]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-[#111111] truncate">Detail Pesanan</h1>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3">
          {/* Order Number & Date */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8E8E93] mb-1">No. Pesanan</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#111111]">{order.order_number}</p>
                  <button
                    onClick={copyOrderNumber}
                    className="text-[#8E8E93] hover:text-[#111111] transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8E8E93] mb-1">Tanggal</p>
                <p className="text-xs text-[#111111]">{formatShortDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <StatusTimeline currentStatus={order.status} statusHistory={statusHistory} />

          {/* Order Items */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-[#111111]">Produk Dipesan</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {item.products?.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239CA3AF%22 stroke-width=%221.5%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3Ccircle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/%3E%3Cpath d=%22m21 15-5-5L5 21%22/%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{item.product_name}</p>
                      <p className="text-xs text-[#8E8E93] mt-1">
                        {item.quantity} x {formatPrice(item.price_at_order)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#111111]">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8E8E93]">Subtotal</span>
                  <span className="text-[#111111]">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8E8E93]">Ongkir</span>
                  {order.shipping_cost === 0 ? (
                    <span className="font-medium text-green-600">Gratis</span>
                  ) : (
                    <span className="text-[#111111]">{formatPrice(order.shipping_cost)}</span>
                  )}
                </div>
                {order.admin_fee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E8E93]">Biaya Layanan</span>
                    <span className="text-[#111111]">{formatPrice(order.admin_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-50">
                  <span className="text-xs font-semibold text-[#111111]">Total</span>
                  <span className="text-sm font-bold text-[#111111]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {address && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8E8E93]" />
                <p className="text-xs font-semibold text-[#111111]">Alamat Pengiriman</p>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-[#111111]">{address.recipient_name}</p>
                <p className="text-xs text-[#8E8E93] mt-0.5">{address.phone}</p>
                <p className="text-xs text-[#111111] mt-2 leading-relaxed">
                  {address.address}
                  {address.landmark && <span className="text-[#8E8E93]"> (Patokan: {address.landmark})</span>}
                </p>
                {address.domiciles && (
                  <p className="text-xs text-[#8E8E93] mt-1.5">
                    {address.domiciles.name}, {address.domiciles.city}, {address.domiciles.province}
                  </p>
                )}
                {address.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#8E8E93]">Catatan: {address.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Courier Info */}
          {courier && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#8E8E93]" />
                <p className="text-xs font-semibold text-[#111111]">Informasi Kurir</p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{courier.full_name}</p>
                    {courier.vehicle_type && (
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        {courier.vehicle_type} {courier.vehicle_plate && `- ${courier.vehicle_plate}`}
                      </p>
                    )}
                  </div>
                  <a
                    href={`tel:${courier.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] rounded-full text-xs font-medium text-white hover:bg-black transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Hubungi
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Payment Action - Prominent for unpaid orders */}
          {!payment && (order.status === 'new' || order.status === 'waiting_payment') && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 text-xs">Menunggu Pembayaran</p>
                    <p className="text-base font-bold text-amber-800 mt-0.5">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>

              <PaymentUploadForm
                orderId={order.id}
                orderTotal={order.total}
                bankInfo={bankInfo}
              />
              <CancelOrderDialog
                orderId={order.id}
                orderNumber={order.order_number}
              />
            </div>
          )}

          {/* Payment Info */}
          {payment && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8E8E93]" />
                <p className="text-xs font-semibold text-[#111111]">Informasi Pembayaran</p>
              </div>
              <div className="p-4 space-y-3">
                {/* Payment Proof Image */}
                {payment.proof_image_url && (
                  <div>
                    <p className="text-[10px] text-[#8E8E93] mb-1.5">Bukti Transfer</p>
                    <img
                      src={payment.proof_image_url}
                      alt="Bukti pembayaran"
                      className="w-full rounded-lg border border-gray-100"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E8E93]">Jumlah</span>
                    <span className="font-medium text-[#111111]">{formatPrice(payment.amount)}</span>
                  </div>
                  {payment.bank_name && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8E8E93]">Bank Tujuan</span>
                      <span className="text-[#111111]">{payment.bank_name}</span>
                    </div>
                  )}
                  {payment.account_number && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8E8E93]">No. Rekening</span>
                      <span className="text-[#111111]">{payment.account_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E8E93]">Status</span>
                    <span className={cn(
                      "font-medium",
                      payment.is_confirmed ? "text-green-600" : "text-amber-600"
                    )}>
                      {payment.is_confirmed ? 'Terkonfirmasi' : 'Menunggu'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Status History Timeline */}
          {statusHistory && statusHistory.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8E8E93]" />
                <p className="text-xs font-semibold text-[#111111]">Riwayat Pesanan</p>
              </div>
              <div className="p-4">
                <div className="relative">
                  {statusHistory.map((history: any, index: number) => {
                    const historyStatus = statusConfig[history.status] || statusConfig.new;
                    const HistoryIcon = historyStatus.icon;
                    const isLast = index === statusHistory.length - 1;

                    return (
                      <div key={history.id} className="relative flex gap-3">
                        {/* Timeline line - positioned absolutely to connect dots */}
                        {!isLast && (
                          <div className="absolute left-[13px] top-7 bottom-0 w-[2px] bg-gradient-to-b from-gray-300 to-gray-200" />
                        )}

                        {/* Icon container */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm",
                            historyStatus.bgColor
                          )}>
                            <HistoryIcon className={cn("w-3.5 h-3.5", historyStatus.color)} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className={cn(
                          "flex-1 min-w-0",
                          !isLast && "pb-6"
                        )}>
                          <p className="text-xs font-semibold text-[#111111]">{historyStatus.label}</p>
                          <p className="text-[10px] text-[#8E8E93] mt-0.5">
                            {formatShortDate(history.created_at)}
                          </p>
                          {history.notes && (
                            <p className="text-[10px] text-[#8E8E93] mt-1 italic">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-[#111111] mb-2">Catatan Pesanan</p>
              <p className="text-xs text-[#8E8E93]">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
      <FloatingNav />
    </div>
  );
}
