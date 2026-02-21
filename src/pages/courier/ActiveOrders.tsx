import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, ChevronRight, Loader2, Navigation, Clock, User, Clipboard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { DeliveryProofUpload } from '@/components/courier/DeliveryProofUpload';
import { useCourierActiveOrders } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; nextStatus: string; nextLabel: string; step: number }> = {
  assigned: { label: 'Ditugaskan', color: 'text-purple-700', bgColor: 'bg-purple-50', nextStatus: 'picked_up', nextLabel: 'Ambil dari Gudang', step: 1 },
  picked_up: { label: 'Diambil', color: 'text-indigo-700', bgColor: 'bg-indigo-50', nextStatus: 'on_delivery', nextLabel: 'Mulai Antar', step: 2 },
  on_delivery: { label: 'Dalam Pengiriman', color: 'text-orange-700', bgColor: 'bg-orange-50', nextStatus: 'delivered', nextLabel: 'Selesai Antar', step: 3 },
};

export default function ActiveOrders() {
  const { profileId } = useAuth();
  const { data: orders, isLoading } = useCourierActiveOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for courier's orders
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel('courier-active-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `courier_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
          queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'delivered') {
      setSelectedOrder(orders?.find(o => o.id === orderId));
      setProofDialogOpen(true);
      return;
    }

    setUpdatingId(orderId);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status diperbarui', {
        description: `Order berhasil diperbarui ke status: ${statusConfig[newStatus]?.label}`,
      });

      queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
    } catch (error: any) {
      toast.error('Gagal update status', {
        description: error.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliverySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['courier-order-history'] });
    queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
  };

  const openMaps = (address: any) => {
    const query = encodeURIComponent(
      `${address?.address || ''}, ${(address?.domiciles as any)?.name || ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  if (isLoading) {
    return <LoadingScreen variant="courier" />;
  }

  return (
    <CourierLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111111]">Order Aktif</h1>
          <p className="text-[13px] text-[#8E8E93] mt-1">
            {orders?.length || 0} pesanan perlu diantar
          </p>
        </div>
      </div>

      {orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-[#111111] mb-2">Tidak Ada Order Aktif</h3>
          <p className="text-[#8E8E93] text-center text-xs max-w-xs">
            Order baru yang ditugaskan kepada Anda akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order, index) => {
            const status = statusConfig[order.status];
            const address = Array.isArray(order.order_addresses)
              ? order.order_addresses[0]
              : order.order_addresses;
            const domicile = address?.domiciles;
            const isExpanded = expandedOrderId === order.id;
            const firstItem = order.order_items?.[0];
            const itemCount = order.order_items?.length || 0;
            const productImage = firstItem?.products?.image_url;

            return (
              <div 
                key={order.id} 
                className={cn(
                  "overflow-hidden transition-all duration-300 animate-fade-in bg-white rounded-3xl shadow-sm hover:shadow-md",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header with Order Number and Status */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold text-[#111111]">{order.order_number}</p>
                        <p className="text-[9px] text-[#8E8E93]">{itemCount} item • {formatTime(order.assigned_at || order.created_at)}</p>
                      </div>
                    </div>
                    <span className={cn(status?.bgColor, status?.color, "text-[9px] px-2.5 py-1 rounded-full font-semibold")}>
                      {status?.label}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Progress Steps */}
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step}
                        className={cn(
                          "flex-1 h-1.5 rounded-full transition-colors",
                          step <= (status?.step || 1) ? "bg-[#111111]" : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>

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

                  {/* Address Card */}
                  <div 
                    className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-3 mb-3 cursor-pointer"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-blue-700 font-semibold mb-1">Alamat Pengiriman</p>
                        <p className="text-xs font-semibold text-[#111111]">{address?.recipient_name}</p>
                        <p className="text-[10px] text-[#8E8E93] mt-0.5 line-clamp-2">{address?.address}</p>
                        {(domicile as any)?.name && (
                          <p className="text-[9px] text-[#8E8E93] mt-0.5">{(domicile as any)?.name}</p>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-blue-600 transition-transform shrink-0",
                        isExpanded && "rotate-90"
                      )} />
                    </div>

                    {/* Phone Number - Always Visible */}
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-blue-200/50">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <a href={`tel:${address?.phone}`} className="text-xs font-semibold text-blue-600">
                        {address?.phone}
                      </a>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-blue-200/50 space-y-3 animate-fade-in">
                        {address?.landmark && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-[#8E8E93]">Patokan</p>
                              <p className="text-xs text-[#111111]">{address.landmark}</p>
                            </div>
                          </div>
                        )}

                        {address?.notes && (
                          <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 text-xs">
                              {address.notes}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* All Items */}
                        <div className="pt-2">
                          <p className="text-[10px] text-[#8E8E93] mb-2">Semua Produk:</p>
                          <div className="space-y-2">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                  {item.products?.image_url ? (
                                    <img 
                                      src={item.products.image_url} 
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#111111] truncate">{item.product_name}</p>
                                  <p className="text-[10px] text-[#8E8E93]">x{item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.notes && (
                          <div className="pt-2">
                            <p className="text-[10px] text-[#8E8E93] mb-1">Catatan Order:</p>
                            <p className="text-xs italic text-[#111111]">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 rounded-full h-11 text-xs"
                      onClick={() => openMaps(address)}
                    >
                      <Navigation className="w-4 h-4" />
                      Navigasi
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-[#111111] hover:bg-black rounded-full h-11 text-xs"
                      onClick={() => handleUpdateStatus(order.id, status?.nextStatus)}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {status?.nextLabel}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <DeliveryProofUpload
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.order_number}
          isOpen={proofDialogOpen}
          onClose={() => {
            setProofDialogOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleDeliverySuccess}
        />
      )}
    </CourierLayout>
  );
}
