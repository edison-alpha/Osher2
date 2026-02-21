import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, MoreHorizontal, Download } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { exportToCSV, formatCurrency as formatCurrencyUtil, formatDate } from '@/lib/exportUtils';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useAdminCategories, useAdminBrands } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  brand_id: string;
  image_url: string;
  selling_price: number;
  hpp: number;
  initial_stock: number;
  min_stock: number;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  category_id: '',
  brand_id: '',
  image_url: '',
  selling_price: 0,
  hpp: 0,
  initial_stock: 0,
  min_stock: 5,
};

export default function AdminProducts() {
  const { toast } = useToast();
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useAdminCategories();
  const { data: brands } = useAdminBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredProducts, itemsPerPage: 10 });

  const handleExport = () => {
    if (!filteredProducts) return;
    const data = filteredProducts.map(p => {
      const latestPrice = p.prices?.sort((a, b) => 
        new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
      )[0];
      return {
        SKU: p.sku,
        Nama: p.name,
        Kategori: p.category?.name || '-',
        Brand: p.brand?.name || '-',
        'Harga Jual': latestPrice?.selling_price || 0,
        HPP: latestPrice?.hpp_average || 0,
        Stok: p.inventory?.[0]?.quantity || 0,
        Status: p.is_active ? 'Aktif' : 'Nonaktif',
      };
    });
    exportToCSV(data, `produk-${formatDate(new Date())}`);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: typeof products[0]) => {
    setEditingProduct(product.id);
    const latestPrice = product.prices?.sort((a, b) => 
      new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    )[0];
    
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      image_url: product.image_url || '',
      selling_price: latestPrice?.selling_price || 0,
      hpp: latestPrice?.hpp_average || 0,
      initial_stock: product.inventory?.[0]?.quantity || 0,
      min_stock: product.inventory?.[0]?.min_stock || 5,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct,
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: formData.category_id || undefined,
          brand_id: formData.brand_id || undefined,
          image_url: formData.image_url || undefined,
        });
        toast({ title: 'Produk berhasil diperbarui' });
      } else {
        await createProduct.mutateAsync({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: formData.category_id || undefined,
          brand_id: formData.brand_id || undefined,
          image_url: formData.image_url || undefined,
          selling_price: formData.selling_price,
          hpp: formData.hpp,
          initial_stock: formData.initial_stock,
          min_stock: formData.min_stock,
        });
        toast({ title: 'Produk berhasil dibuat' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ 
        title: 'Gagal menyimpan produk', 
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct.mutateAsync(selectedProduct);
      toast({ title: 'Produk berhasil dinonaktifkan' });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({ 
        title: 'Gagal menghapus produk', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Produk</h2>
        <p className="text-base text-gray-600">Tambah, edit, dan kelola produk di katalog</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={!filteredProducts?.length}
            className="flex-1 sm:flex-none rounded-full bg-gray-900 hover:bg-gray-800 text-white border-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Products Table Card */}
      <Card className="shadow-sm border-0 bg-white" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
              <Package className="h-5 w-5" />
              Daftar Produk
            </CardTitle>
            {filteredProducts && (
              <Badge variant="secondary" className="text-sm rounded-full">
                {filteredProducts.length} produk
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                      <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                      <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kategori</TableHead>
                      <TableHead className="font-semibold text-gray-700">Harga</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stok</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData && paginatedData.length > 0 ? (
                      paginatedData.map((product) => {
                        const latestPrice = product.prices?.sort((a, b) => 
                          new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
                        )[0];
                        const stock = product.inventory?.[0]?.quantity || 0;
                        const minStock = product.inventory?.[0]?.min_stock || 0;

                        return (
                          <TableRow key={product.id} className="hover:bg-gray-50 border-b border-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="h-12 w-12 rounded-xl object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  {product.brand?.name && (
                                    <p className="text-xs text-gray-500">{product.brand.name}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-700">{product.sku}</TableCell>
                            <TableCell>
                              {product.category?.name ? (
                                <Badge variant="outline" className="rounded-full border-gray-200">{product.category.name}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900">
                              {formatCurrency(latestPrice?.selling_price || 0)}
                            </TableCell>
                            <TableCell>
                              <span className={stock <= minStock ? 'text-red-600 font-bold' : 'font-medium text-gray-900'}>
                                {stock}
                              </span>
                              {stock <= minStock && (
                                <Badge variant="destructive" className="ml-2 text-xs rounded-full">Low</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={product.is_active ? 'default' : 'secondary'}
                                className="rounded-full"
                              >
                                {product.is_active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl">
                                  <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedProduct(product.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Nonaktifkan
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                          <p className="text-gray-500">Tidak ada produk ditemukan</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingProduct ? 'Perbarui informasi produk' : 'Isi detail produk yang akan ditambahkan'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Nama Produk *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama produk"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-gray-700">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="PRD-001"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi produk"
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Kategori</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories?.filter(c => c.is_active).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Brand</Label>
                <Select 
                  value={formData.brand_id} 
                  onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih brand" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {brands?.filter(b => b.is_active).map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Gambar Produk</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                bucket="product-images"
                folder="products"
                aspectRatio="square"
              />
            </div>

            {!editingProduct && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="selling_price" className="text-gray-700">Harga Jual *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      placeholder="0"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hpp" className="text-gray-700">HPP *</Label>
                    <Input
                      id="hpp"
                      type="number"
                      value={formData.hpp}
                      onChange={(e) => setFormData({ ...formData, hpp: Number(e.target.value) })}
                      placeholder="0"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial_stock" className="text-gray-700">Stok Awal</Label>
                    <Input
                      id="initial_stock"
                      type="number"
                      value={formData.initial_stock}
                      onChange={(e) => setFormData({ ...formData, initial_stock: Number(e.target.value) })}
                      placeholder="0"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock" className="text-gray-700">Stok Minimum</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                      placeholder="5"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || createProduct.isPending || updateProduct.isPending}
              className="rounded-full"
            >
              {createProduct.isPending || updateProduct.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Nonaktifkan Produk</DialogTitle>
            <DialogDescription className="text-gray-600">
              Produk akan dinonaktifkan dan tidak muncul di katalog. Anda yakin ingin melanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-full">
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              {deleteProduct.isPending ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
