import { useState, useEffect } from 'react';
import { Package, MapPin, Phone, Loader2, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CourierLayout } from '@/components/courier/CourierLayout';
import { useCourierAvailableOrders, useTakeOrder } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/exportUtils';
import { Input } from '@/components/ui/input';

export default function AvailableOrders() {
    const { profileId } = useAuth();
    const { data: orders, isLoading } = useCourierAvailableOrders();
    const takeOrder = useTakeOrder();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // Subscribe to real-time updates so couriers see new paid orders instantly
    useEffect(() => {
        if (!profileId) return;

        const channel = supabase
            .channel('courier-available-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `status=eq.paid`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['courier-available-orders'] });
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

    const handleTakeOrder = async (orderId: string) => {
        try {
            await takeOrder.mutateAsync(orderId);
            toast.success('Berhasil', {
                description: 'Pesanan berhasil Anda ambil dan siap diantar.',
            });
        } catch (error: any) {
            toast.error('Gagal mengambil pesanan', {
                description: error.message || 'Pesanan mungkin sudah diambil kurir lain.',
            });
        }
    };

    const filteredOrders = orders?.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.order_addresses?.[0]?.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.order_addresses?.[0]?.domiciles?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <CourierLayout>
            <div className="mb-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Pesanan Tersedia</h1>
                    <p className="text-sm text-[#8E8E93] mt-1">Daftar pesanan yang siap untuk diantar</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
                    <Input
                        placeholder="Cari pesanan, resi, nama, lokasi..."
                        className="pl-9 rounded-xl bg-white border-gray-100 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-10 w-full mt-4 rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : !filteredOrders?.length ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl shadow-sm border border-gray-50 mt-8">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-[#111111] mb-1">
                        {search ? 'Pencarian tidak ditemukan' : 'Tidak ada pesanan tersedia'}
                    </h3>
                    <p className="text-sm text-[#8E8E93]">
                        {search ? 'Coba ubah kata kunci pencarian Anda' : 'Saat ini tidak ada pesanan baru yang menunggu kurir.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {filteredOrders.map((order) => {
                        const address = order.order_addresses?.[0];
                        const items = order.order_items || [];
                        const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

                        return (
                            <Card key={order.id} className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white transition-all hover:shadow-md">
                                <CardContent className="p-0">
                                    {/* Header Info */}
                                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-[#111111]">{order.order_number}</p>
                                                <p className="text-xs text-[#8E8E93] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body Content */}
                                    <div className="p-4 space-y-4">
                                        {/* Destination */}
                                        <div className="flex items-start gap-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                                            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-[#111111] truncate">
                                                    {address?.recipient_name}
                                                </p>
                                                <p className="text-xs text-[#8E8E93] mt-1 line-clamp-2 leading-relaxed">
                                                    {address?.address}
                                                    {address?.landmark && ` (${address.landmark})`}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-100 text-[10px] font-medium text-gray-600 shrink-0 shadow-sm">
                                                        {address?.domiciles?.name}
                                                    </span>
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 border border-blue-100 shrink-0">
                                                        <a href={`https://wa.me/${address?.phone?.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-full text-blue-600 cursor-pointer" title="Chat WhatsApp">
                                                            <Phone className="w-3 h-3" />
                                                        </a>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="flex items-center justify-between text-sm">
                                            <p className="text-[#8E8E93]">
                                                {totalItems} Produk
                                            </p>
                                            <p className="font-semibold text-[#111111]">
                                                {formatPrice(order.total)}
                                            </p>
                                        </div>

                                        <Button
                                            className="w-full h-11 rounded-xl bg-[#111111] hover:bg-[#333] text-white shadow-sm flex items-center justify-center gap-2"
                                            onClick={() => handleTakeOrder(order.id)}
                                            disabled={takeOrder.isPending}
                                        >
                                            {takeOrder.isPending && takeOrder.variables === order.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                                                    <span>Mengambil...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Ambil Pesanan</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </CourierLayout>
    );
}
