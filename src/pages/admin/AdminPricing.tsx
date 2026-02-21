import { useState } from 'react';
import { useAdminProducts, useUpdateProductPrice, useProductPriceHistory } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit, History, DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AdminPricing() {
  const { data: products, isLoading } = useAdminProducts();
  const updatePrice = useUpdateProductPrice();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({
    selling_price: '',
    hpp_average: '',
    het: '',
  });

  const { data: priceHistory } = useProductPriceHistory(selectedProduct || '');

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPrice = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product?.prices || product.prices.length === 0) return null;
    return product.prices.sort((a, b) => 
      new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    )[0];
  };

  const getMargin = (sellingPrice: number, hpp: number) => {
    if (hpp === 0) return 0;
    return ((sellingPrice - hpp) / sellingPrice) * 100;
  };

  const handleEditPrice = (product: typeof products extends (infer T)[] | undefined ? T : never) => {
    if (!product) return;
    const currentPrice = getCurrentPrice(product);
    setSelectedProduct(product.id);
    setPriceForm({
      selling_price: currentPrice?.selling_price?.toString() || '',
      hpp_average: currentPrice?.hpp_average?.toString() || '',
      het: currentPrice?.het?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProduct(productId);
    setHistoryDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedProduct) return;
    
    try {
      await updatePrice.mutateAsync({
        product_id: selectedProduct,
        selling_price: parseFloat(priceForm.selling_price),
        hpp_average: parseFloat(priceForm.hpp_average),
        het: priceForm.het ? parseFloat(priceForm.het) : undefined,
      });
      toast.success('Harga berhasil diperbarui');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Gagal memperbarui harga');
    }
  };

  // Stats
  const totalProducts = products?.length || 0;
  const productsWithPrice = products?.filter(p => p.prices && p.prices.length > 0).length || 0;
  const lowMarginProducts = products?.filter(p => {
    const price = getCurrentPrice(p);
    if (!price) return false;
    const margin = getMargin(Number(price.selling_price), Number(price.hpp_average));
    return margin < 10;
  }).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Harga & HPP</h2>
        <p className="text-base text-gray-600">Atur harga jual, HPP, dan HET untuk setiap produk</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Produk</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
            <p className="text-xs text-gray-600 mt-3">Di katalog</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Sudah Ada Harga</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{productsWithPrice}</div>
            <p className="text-xs text-gray-600 mt-3">Harga tersedia</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFE6E7', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Margin Rendah</CardTitle>
            <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-pink-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{lowMarginProducts}</div>
            <p className="text-xs text-gray-600 mt-3">Margin &lt; 10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-gray-900 text-lg font-bold">Daftar Harga Produk</CardTitle>
              <CardDescription className="text-gray-500 mt-1 text-sm">Kelola harga jual, HPP, dan HET produk</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama atau SKU produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-gray-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">HPP</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Harga Jual</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">HET</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Margin</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-400">Tidak ada produk ditemukan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts?.map((product) => {
                      const currentPrice = getCurrentPrice(product);
                      const margin = currentPrice 
                        ? getMargin(Number(currentPrice.selling_price), Number(currentPrice.hpp_average))
                        : 0;

                      return (
                        <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-2xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice ? (
                              <span className="font-mono text-sm text-gray-900">
                                {formatCurrency(Number(currentPrice.hpp_average))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice ? (
                              <span className="font-mono font-semibold text-gray-900">
                                {formatCurrency(Number(currentPrice.selling_price))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {currentPrice?.het ? (
                              <span className="font-mono text-sm text-gray-700">
                                {formatCurrency(Number(currentPrice.het))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {currentPrice ? (
                              <Badge 
                                className={`rounded-full px-3 py-1 font-medium ${
                                  margin >= 20 
                                    ? 'bg-green-100 text-green-700' 
                                    : margin >= 10 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {margin.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPrice(product)}
                                className="rounded-full hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(product.id)}
                                className="rounded-full hover:bg-purple-50 hover:text-purple-700"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Update Harga Produk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">HPP (Harga Pokok Penjualan)</Label>
              <Input
                type="number"
                placeholder="Masukkan HPP"
                value={priceForm.hpp_average}
                onChange={(e) => setPriceForm(prev => ({ ...prev, hpp_average: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Harga Jual</Label>
              <Input
                type="number"
                placeholder="Masukkan harga jual"
                value={priceForm.selling_price}
                onChange={(e) => setPriceForm(prev => ({ ...prev, selling_price: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">HET (Harga Eceran Tertinggi) - Opsional</Label>
              <Input
                type="number"
                placeholder="Masukkan HET"
                value={priceForm.het}
                onChange={(e) => setPriceForm(prev => ({ ...prev, het: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </div>
            {priceForm.selling_price && priceForm.hpp_average && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Margin Preview</p>
                <p className="text-2xl font-bold text-blue-900">
                  {getMargin(
                    parseFloat(priceForm.selling_price) || 0,
                    parseFloat(priceForm.hpp_average) || 0
                  ).toFixed(2)}%
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Profit: {formatCurrency(
                    (parseFloat(priceForm.selling_price) || 0) - (parseFloat(priceForm.hpp_average) || 0)
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSavePrice}
              disabled={!priceForm.selling_price || !priceForm.hpp_average || updatePrice.isPending}
              className="rounded-full bg-gray-900 hover:bg-gray-800"
            >
              {updatePrice.isPending ? 'Menyimpan...' : 'Simpan Harga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <History className="h-5 w-5 text-purple-600" />
              Riwayat Harga
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {priceHistory && priceHistory.length > 0 ? (
              priceHistory.map((price, index) => (
                <div 
                  key={price.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      className={`rounded-full px-3 py-1 font-medium ${
                        index === 0 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {index === 0 ? 'Harga Aktif' : 'Riwayat'}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">
                      {format(new Date(price.effective_date), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">HPP</p>
                      <p className="font-bold text-gray-900">{formatCurrency(Number(price.hpp_average))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Harga Jual</p>
                      <p className="font-bold text-gray-900">{formatCurrency(Number(price.selling_price))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">HET</p>
                      <p className="font-bold text-gray-900">{price.het ? formatCurrency(Number(price.het)) : '-'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">Belum ada riwayat harga</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
