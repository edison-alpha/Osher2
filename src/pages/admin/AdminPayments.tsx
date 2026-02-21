import { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Download
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate as formatDateUtil } from '@/lib/exportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPaymentsWithSignedUrls } from '@/lib/storageUtils';

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('payment_confirmations')
        .select(`
          *,
          orders (
            id,
            order_number,
            total,
            status,
            buyer_id,
            buyer_profiles (
              id,
              full_name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('is_confirmed', false);
      } else if (statusFilter === 'confirmed') {
        query = query.eq('is_confirmed', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Generate signed URLs for payment proofs
      return await getPaymentsWithSignedUrls(data);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const payment = payments?.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      // Update payment confirmation
      const { error: paymentError } = await supabase
        .from('payment_confirmations')
        .update({ 
          is_confirmed: true, 
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update order status to paid
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', payment.order_id);

      if (orderError) throw orderError;

      return paymentId;
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dikonfirmasi');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setDetailOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengkonfirmasi pembayaran');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const payment = payments?.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      // Update payment with rejection note
      const { error: paymentError } = await supabase
        .from('payment_confirmations')
        .update({ 
          notes: `Ditolak: ${reason}`,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update order status back to new
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'new' })
        .eq('id', payment.order_id);

      if (orderError) throw orderError;

      return paymentId;
    },
    onSuccess: () => {
      toast.success('Pembayaran ditolak');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setDetailOpen(false);
      setSelectedPayment(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menolak pembayaran');
    },
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

  const filteredPayments = payments?.filter(payment => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      payment.orders?.order_number?.toLowerCase().includes(searchLower) ||
      payment.orders?.buyer_profiles?.full_name?.toLowerCase().includes(searchLower) ||
      payment.bank_name?.toLowerCase().includes(searchLower)
    );
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredPayments, itemsPerPage: 10 });

  const handleExport = () => {
    if (!filteredPayments) return;
    const data = filteredPayments.map(p => ({
      'No Order': p.orders?.order_number || '-',
      Buyer: p.orders?.buyer_profiles?.full_name || '-',
      'Jumlah Transfer': p.amount,
      'Total Order': p.orders?.total || 0,
      Bank: p.bank_name || '-',
      'No Rekening': p.account_number || '-',
      Status: p.is_confirmed ? 'Dikonfirmasi' : 'Menunggu',
      'Tgl Upload': formatDate(p.created_at),
    }));
    exportToCSV(data, `pembayaran-${formatDateUtil(new Date())}`);
  };

  const pendingCount = payments?.filter(p => !p.is_confirmed).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Konfirmasi Pembayaran</h2>
        <p className="text-base text-gray-600">Verifikasi dan konfirmasi bukti pembayaran pelanggan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFF4E6', borderRadius: '32px' }}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments?.filter(p => !p.is_confirmed).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E8F5E9', borderRadius: '32px' }}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dikonfirmasi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments?.filter(p => p.is_confirmed).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E3F2FD', borderRadius: '32px' }}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hari Ini</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(
                    payments
                      ?.filter(p => {
                        const today = new Date().toDateString();
                        return new Date(p.created_at).toDateString() === today;
                      })
                      .reduce((sum, p) => sum + p.amount, 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari order, buyer, atau bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] rounded-full">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
            <SelectItem value="confirmed">Sudah Dikonfirmasi</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={handleExport} 
          disabled={!filteredPayments?.length}
          className="rounded-full bg-gray-900 hover:bg-gray-800 text-white border-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Payments List */}
      <Card className="shadow-sm border-0 bg-white" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
              <CreditCard className="h-5 w-5" />
              Daftar Pembayaran
            </CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-sm rounded-full">
                {pendingCount} Menunggu
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredPayments?.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Tidak Ada Pembayaran</h3>
              <p className="text-muted-foreground">
                Belum ada pembayaran yang perlu dikonfirmasi
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {paginatedData?.map((payment) => (
                <div
                  key={payment.id}
                  className={`cursor-pointer hover:shadow-md transition-all rounded-2xl border p-4 ${
                    !payment.is_confirmed ? 'border-amber-200 bg-amber-50/50' : 'bg-gray-50 border-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedPayment(payment);
                    setDetailOpen(true);
                  }}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white flex-shrink-0 border border-gray-200">
                      {payment.proof_image_url ? (
                        <img
                          src={payment.proof_image_url}
                          alt="Bukti transfer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900">
                            {payment.orders?.order_number}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {payment.orders?.buyer_profiles?.full_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {payment.orders?.buyer_profiles?.phone}
                          </p>
                        </div>
                        <Badge 
                          variant={payment.is_confirmed ? 'default' : 'secondary'}
                          className="rounded-full"
                        >
                          {payment.is_confirmed ? 'Dikonfirmasi' : 'Menunggu'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Jumlah Transfer</span>
                          <p className="font-bold text-gray-900">{formatPrice(payment.amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Total Order</span>
                          <p className="font-bold text-gray-900">{formatPrice(payment.orders?.total || 0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Bank Pengirim</span>
                          <p className="font-semibold text-gray-900">{payment.bank_name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">No. Rekening</span>
                          <p className="font-semibold text-gray-900">{payment.account_number || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Upload: {formatDate(payment.created_at)}
                        </p>
                        {payment.amount !== payment.orders?.total && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                            ⚠️ Selisih {formatPrice(Math.abs(payment.amount - (payment.orders?.total || 0)))}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full hover:bg-gray-200">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedPayment?.orders?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Proof Image */}
              {selectedPayment.proof_image_url && (
                <div className="space-y-2">
                  <Label>Bukti Transfer</Label>
                  <div className="relative">
                    <img 
                      src={selectedPayment.proof_image_url} 
                      alt="Bukti transfer" 
                      className="w-full rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => window.open(selectedPayment.proof_image_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Buka
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Buyer</Label>
                  <p className="font-medium">{selectedPayment.orders?.buyer_profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.orders?.buyer_profiles?.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status Order</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedPayment.orders?.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jumlah Transfer</Label>
                  <p className="font-medium text-lg">{formatPrice(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Order</Label>
                  <p className="font-medium text-lg">{formatPrice(selectedPayment.orders?.total || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bank Tujuan</Label>
                  <p>{selectedPayment.bank_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">No. Rekening Pengirim</Label>
                  <p>{selectedPayment.account_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Transfer</Label>
                  <p>{selectedPayment.transfer_date ? formatDate(selectedPayment.transfer_date) : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Upload</Label>
                  <p>{formatDate(selectedPayment.created_at)}</p>
                </div>
              </div>

              {/* Amount Mismatch Warning */}
              {selectedPayment.amount !== selectedPayment.orders?.total && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Jumlah transfer tidak sesuai dengan total order
                  </p>
                  <p className="text-sm text-yellow-700">
                    Selisih: {formatPrice(Math.abs(selectedPayment.amount - (selectedPayment.orders?.total || 0)))}
                  </p>
                </div>
              )}

              {/* Reject Reason */}
              {!selectedPayment.is_confirmed && (
                <div className="space-y-2">
                  <Label>Alasan Penolakan (jika ditolak)</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Masukkan alasan penolakan..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {!selectedPayment?.is_confirmed && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      toast.error('Masukkan alasan penolakan');
                      return;
                    }
                    rejectMutation.mutate({ 
                      paymentId: selectedPayment.id, 
                      reason: rejectReason 
                    });
                  }}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Tolak
                </Button>
                <Button
                  onClick={() => confirmMutation.mutate(selectedPayment.id)}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Konfirmasi Pembayaran
                </Button>
              </>
            )}
            {selectedPayment?.is_confirmed && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Pembayaran sudah dikonfirmasi</span>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
