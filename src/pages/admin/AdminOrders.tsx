import { useState, useRef } from 'react';
import { Search, Eye, ShoppingCart, Filter, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminOrders } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { Invoice } from '@/components/shared/Invoice';
import { exportToCSV, formatCurrency, formatDate } from '@/lib/exportUtils';
import { useReactToPrint } from 'react-to-print';
import { DateRange } from 'react-day-picker';

type OrderStatus = Database['public']['Enums']['order_status'];

const statusColors: Record<string, string> = {
  new: 'bg-info text-info-foreground',
  waiting_payment: 'bg-warning text-warning-foreground',
  paid: 'bg-success text-success-foreground',
  assigned: 'bg-primary text-primary-foreground',
  on_delivery: 'bg-accent text-accent-foreground',
  delivered: 'bg-success text-success-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
  refunded: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive text-destructive-foreground',
  returned: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  new: 'Baru',
  waiting_payment: 'Menunggu Bayar',
  paid: 'Dibayar',
  assigned: 'Ditugaskan',
  on_delivery: 'Dalam Pengantaran',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
  refunded: 'Refund',
  failed: 'Gagal',
  returned: 'Dikembalikan',
};

const statusOptions: OrderStatus[] = [
  'new', 'waiting_payment', 'paid', 'assigned',
  'on_delivery', 'delivered', 'cancelled', 'refunded', 'failed', 'returned'
];

export default function AdminOrders() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { data: orders, isLoading } = useAdminOrders(statusFilter === 'all' ? undefined : statusFilter);
  const [selectedOrder, setSelectedOrder] = useState<typeof orders extends (infer T)[] ? T : never | null>(null);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const filteredOrders = orders?.filter(o => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.full_name?.toLowerCase().includes(search.toLowerCase());

    const orderDate = new Date(o.created_at);
    const matchesDate = !dateRange?.from || (
      orderDate >= dateRange.from &&
      (!dateRange.to || orderDate <= dateRange.to)
    );

    return matchesSearch && matchesDate;
  });

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredOrders, itemsPerPage: 15 });

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${selectedOrder?.order_number || 'order'}`,
  });

  const handleExport = () => {
    if (!filteredOrders) return;
    const data = filteredOrders.map(o => ({
      'No. Pesanan': o.order_number,
      'Pembeli': o.buyer?.full_name || '-',
      'Tanggal': formatDate(o.created_at),
      'Total': formatCurrency(Number(o.total)),
      'Status': statusLabels[o.status] || o.status,
      'Kurir': o.courier?.full_name || '-',
    }));
    exportToCSV(data, 'orders');
    toast({ title: 'Export berhasil', description: 'File CSV berhasil diunduh' });
  };

  const handleViewDetail = (order: typeof orders extends (infer T)[] ? T : never) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h2>
        <p className="text-base text-gray-600">Pantau dan kelola semua pesanan pelanggan</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pesanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
            <SelectTrigger className="w-[180px] rounded-full">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Filter tanggal"
            className="w-full md:w-auto rounded-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!filteredOrders?.length}
          className="rounded-full bg-gray-900 hover:bg-gray-800 text-white border-0"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
            <ShoppingCart className="h-5 w-5" />
            Daftar Pesanan
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-full">{totalItems}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">{isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pembeli</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kurir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.buyer?.full_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{order.buyer?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status]} rounded-full`}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.courier?.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-gray-100"
                            onClick={() => handleViewDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
              Detail Pesanan {selectedOrder?.order_number}
              <Button variant="outline" size="sm" onClick={() => handlePrint()} className="rounded-full">
                <Printer className="mr-2 h-4 w-4" />
                Cetak Invoice
              </Button>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedOrder && format(new Date(selectedOrder.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className={`rounded-full font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Informasi Pembeli</h4>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 space-y-1 border border-gray-200">
                  <p className="text-gray-900"><span className="text-gray-600">Nama:</span> <span className="font-semibold">{selectedOrder.buyer?.full_name}</span></p>
                  <p className="text-gray-900"><span className="text-gray-600">Telepon:</span> <span className="font-semibold">{selectedOrder.buyer?.phone}</span></p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.order_address?.[0] && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Alamat Pengiriman</h4>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 space-y-1 border border-gray-200">
                    <p className="font-bold text-gray-900">{selectedOrder.order_address[0].recipient_name}</p>
                    <p className="text-gray-900">{selectedOrder.order_address[0].phone}</p>
                    <p className="text-gray-900">{selectedOrder.order_address[0].address}</p>
                    {selectedOrder.order_address[0].landmark && (
                      <p className="text-gray-600">Patokan: {selectedOrder.order_address[0].landmark}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product_name}
                            className="h-12 w-12 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gray-200" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">x{item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-900">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span className="text-gray-600">Ongkir</span>
                  {selectedOrder.shipping_cost === 0 ? (
                    <span className="font-bold text-green-600">FREE</span>
                  ) : (
                    <span className="font-semibold">{formatCurrency(Number(selectedOrder.shipping_cost))}</span>
                  )}
                </div>
                <div className="flex justify-between text-gray-900">
                  <span className="text-gray-600">Biaya Layanan</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedOrder.admin_fee))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Catatan</h4>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Courier Info */}
              {selectedOrder.courier && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Informasi Kurir</h4>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 space-y-1 border border-gray-200">
                    <p className="text-gray-900"><span className="text-gray-600">Nama:</span> <span className="font-semibold">{selectedOrder.courier.full_name}</span></p>
                    <p className="text-gray-900"><span className="text-gray-600">Telepon:</span> <span className="font-semibold">{selectedOrder.courier.phone}</span></p>
                  </div>
                </div>
              )}

              {/* Hidden Invoice for printing */}
              <div className="hidden">
                <Invoice
                  ref={invoiceRef}
                  orderNumber={selectedOrder.order_number}
                  createdAt={selectedOrder.created_at}
                  status={selectedOrder.status}
                  buyerName={selectedOrder.buyer?.full_name || '-'}
                  address={selectedOrder.order_address?.[0] as any}
                  items={selectedOrder.order_items || []}
                  subtotal={Number(selectedOrder.subtotal)}
                  shippingCost={Number(selectedOrder.shipping_cost)}
                  adminFee={Number(selectedOrder.admin_fee)}
                  total={Number(selectedOrder.total)}
                  notes={selectedOrder.notes || undefined}
                  courierName={selectedOrder.courier?.full_name}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
