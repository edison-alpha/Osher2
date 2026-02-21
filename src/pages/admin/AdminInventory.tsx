import { useState } from 'react';
import { Search, Box, Plus, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Download } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate } from '@/lib/exportUtils';
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
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminInventory, useInventoryMovements, useAddInventoryMovement, useAdminProducts } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminInventory() {
  const { toast } = useToast();
  const { data: inventory, isLoading: inventoryLoading } = useAdminInventory();
  const { data: movements, isLoading: movementsLoading } = useInventoryMovements();
  const { data: products } = useAdminProducts();
  const addMovement = useAddInventoryMovement();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementData, setMovementData] = useState({
    product_id: '',
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
    unit_cost: 0,
  });

  const filteredInventory = inventory?.filter(inv =>
    inv.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.product?.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = filteredInventory?.filter(inv => inv.quantity <= inv.min_stock);

  const {
    paginatedData: paginatedInventory,
    currentPage: invPage,
    totalPages: invTotalPages,
    goToPage: goToInvPage,
    startIndex: invStartIndex,
    endIndex: invEndIndex,
    totalItems: invTotalItems,
  } = usePagination({ data: filteredInventory, itemsPerPage: 10 });

  const {
    paginatedData: paginatedMovements,
    currentPage: movPage,
    totalPages: movTotalPages,
    goToPage: goToMovPage,
    startIndex: movStartIndex,
    endIndex: movEndIndex,
    totalItems: movTotalItems,
  } = usePagination({ data: movements, itemsPerPage: 10 });

  const handleExportInventory = () => {
    if (!filteredInventory) return;
    const data = filteredInventory.map(inv => ({
      SKU: inv.product?.sku || '-',
      Produk: inv.product?.name || '-',
      Stok: inv.quantity,
      'Min Stok': inv.min_stock,
      Reserved: inv.reserved_quantity,
      Available: inv.quantity - inv.reserved_quantity,
    }));
    exportToCSV(data, `inventori-${formatDate(new Date())}`);
  };

  const handleExportMovements = () => {
    if (!movements) return;
    const data = movements.map(mov => ({
      Tanggal: formatDate(new Date(mov.created_at)),
      SKU: mov.product?.sku || '-',
      Produk: mov.product?.name || '-',
      Tipe: mov.movement_type === 'in' ? 'Masuk' : mov.movement_type === 'out' ? 'Keluar' : 'Adjustment',
      Qty: mov.quantity,
      Sebelum: mov.quantity_before,
      Sesudah: mov.quantity_after,
      Alasan: mov.reason,
      'Unit Cost': mov.unit_cost || 0,
    }));
    exportToCSV(data, `mutasi-stok-${formatDate(new Date())}`);
  };

  const handleOpenMovement = (productId?: string) => {
    setMovementData({
      product_id: productId || '',
      movement_type: 'in',
      quantity: 0,
      reason: '',
      unit_cost: 0,
    });
    setDialogOpen(true);
  };

  const handleSubmitMovement = async () => {
    if (!movementData.product_id || !movementData.quantity || !movementData.reason) {
      toast({ title: 'Lengkapi semua field yang wajib', variant: 'destructive' });
      return;
    }

    try {
      await addMovement.mutateAsync(movementData);
      toast({ title: 'Mutasi stok berhasil dicatat' });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Gagal mencatat mutasi',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <RotateCcw className="h-4 w-4 text-info" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      default:
        return 'Adjustment';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Inventori & Stok</h2>
        <p className="text-base text-gray-600">Pantau stok produk dan catat mutasi barang masuk/keluar</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full border-gray-200"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleExportInventory} 
            disabled={!filteredInventory?.length}
            className="flex-1 sm:flex-none rounded-full border-gray-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={() => handleOpenMovement()} 
            className="flex-1 sm:flex-none rounded-full bg-gray-900 hover:bg-gray-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mutasi
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: '#FFF4E6', borderRadius: '24px' }}>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 text-orange-700 text-base font-bold">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              Peringatan Stok Rendah ({lowStockItems.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex flex-wrap gap-2">
              {lowStockItems.slice(0, 10).map((inv) => (
                <Badge key={inv.id} className="rounded-full bg-orange-100 text-orange-700 border-orange-200 px-3 py-1">
                  {inv.product?.name}: {inv.quantity} unit
                </Badge>
              ))}
              {lowStockItems.length > 10 && (
                <Badge className="rounded-full bg-orange-100 text-orange-700 border-orange-200 px-3 py-1">
                  +{lowStockItems.length - 10} lainnya
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full bg-gray-100 p-1">
          <TabsTrigger value="stock" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Stok Produk</TabsTrigger>
          <TabsTrigger value="movements" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Riwayat Mutasi</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
            <CardHeader className="border-b border-gray-100 pb-5 pt-6">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Box className="h-5 w-5 text-blue-600" />
                </div>
                Stok Inventori
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inventoryLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                          <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Stok</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Min. Stok</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Reserved</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Available</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInventory && paginatedInventory.length > 0 ? (
                          paginatedInventory.map((inv) => {
                            const isLowStock = inv.quantity <= inv.min_stock;
                            const available = inv.quantity - inv.reserved_quantity;

                            return (
                              <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {inv.product?.image_url ? (
                                      <img
                                        src={inv.product.image_url}
                                        alt={inv.product?.name}
                                        className="h-12 w-12 rounded-2xl object-cover border border-gray-200"
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200">
                                        <Box className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                    <span className="font-semibold text-gray-900">{inv.product?.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">{inv.product?.sku}</TableCell>
                                <TableCell className="text-center">
                                  <span className={isLowStock ? 'text-red-600 font-bold' : 'font-semibold text-gray-900'}>
                                    {inv.quantity}
                                  </span>
                                  {isLowStock && (
                                    <Badge className="ml-2 text-xs rounded-full bg-red-100 text-red-700">Low</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-gray-600">
                                  {inv.min_stock}
                                </TableCell>
                                <TableCell className="text-center text-gray-600">
                                  {inv.reserved_quantity}
                                </TableCell>
                                <TableCell className="text-center font-bold text-gray-900">
                                  {available}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenMovement(inv.product_id)}
                                    className="rounded-full border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Mutasi
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <Box className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400">Tidak ada data inventori</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {invTotalPages > 1 && (
                    <div className="p-4 border-t">
                      <DataPagination
                        currentPage={invPage}
                        totalPages={invTotalPages}
                        onPageChange={goToInvPage}
                        startIndex={invStartIndex}
                        endIndex={invEndIndex}
                        totalItems={invTotalItems}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
            <CardHeader className="border-b border-gray-100 pb-5 pt-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                </div>
                Riwayat Mutasi
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportMovements} 
                disabled={!movements?.length}
                className="rounded-full border-gray-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {movementsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                          <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Tipe</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Qty</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Sebelum</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Sesudah</TableHead>
                          <TableHead className="font-semibold text-gray-700">Alasan</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Unit Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMovements && paginatedMovements.length > 0 ? (
                          paginatedMovements.map((mov) => (
                            <TableRow key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                              <TableCell className="text-sm text-gray-600">
                                {format(new Date(mov.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-gray-900">{mov.product?.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">{mov.product?.sku}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getMovementIcon(mov.movement_type)}
                                  <span className="text-sm font-medium">{getMovementLabel(mov.movement_type)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-gray-900">
                                {mov.movement_type === 'in' ? '+' : mov.movement_type === 'out' ? '-' : ''}
                                {mov.quantity}
                              </TableCell>
                              <TableCell className="text-center text-gray-600">
                                {mov.quantity_before}
                              </TableCell>
                              <TableCell className="text-center font-bold text-gray-900">
                                {mov.quantity_after}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                                {mov.reason}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-gray-900">
                                {mov.unit_cost ? formatCurrency(Number(mov.unit_cost)) : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <RotateCcw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400">Belum ada riwayat mutasi</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {movTotalPages > 1 && (
                    <div className="p-4 border-t">
                      <DataPagination
                        currentPage={movPage}
                        totalPages={movTotalPages}
                        onPageChange={goToMovPage}
                        startIndex={movStartIndex}
                        endIndex={movEndIndex}
                        totalItems={movTotalItems}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Tambah Mutasi Stok</DialogTitle>
            <DialogDescription className="text-gray-500">
              Catat perubahan stok produk
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Produk *</Label>
              <Select
                value={movementData.product_id}
                onValueChange={(v) => setMovementData({ ...movementData, product_id: v })}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products?.filter(p => p.is_active).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Tipe Mutasi *</Label>
              <Select
                value={movementData.movement_type}
                onValueChange={(v) => setMovementData({ ...movementData, movement_type: v as 'in' | 'out' | 'adjustment' })}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Stok Masuk
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Stok Keluar
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-blue-600" />
                      Penyesuaian
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Jumlah *</Label>
                <Input
                  type="number"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                  placeholder="0"
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Unit Cost</Label>
                <Input
                  type="number"
                  value={movementData.unit_cost}
                  onChange={(e) => setMovementData({ ...movementData, unit_cost: Number(e.target.value) })}
                  placeholder="0"
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Alasan *</Label>
              <Textarea
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="Contoh: Restok dari supplier, Barang rusak, dll"
                rows={3}
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmitMovement} 
              disabled={addMovement.isPending}
              className="rounded-full bg-gray-900 hover:bg-gray-800"
            >
              {addMovement.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
