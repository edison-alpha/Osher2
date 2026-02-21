import { useState } from 'react';
import { useAdminCouriers, useUpdateCourier, useCreateCourier } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Truck, Phone, Package, Plus, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { exportToCSV, formatDate } from '@/lib/exportUtils';

interface CourierFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
}

const initialFormData: CourierFormData = {
  email: '',
  password: '',
  full_name: '',
  phone: '',
  vehicle_type: '',
  vehicle_plate: '',
};

export default function AdminCouriers() {
  const { data: couriers, isLoading } = useAdminCouriers();
  const updateCourier = useUpdateCourier();
  const createCourier = useCreateCourier();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCourier, setSelectedCourier] = useState<typeof couriers extends (infer T)[] | undefined ? T : never>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CourierFormData>(initialFormData);
  const [editFormData, setEditFormData] = useState<{
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    vehicle_plate: string;
  } | null>(null);

  const filteredCouriers = couriers?.filter(courier => {
    const matchesSearch = 
      courier.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.includes(searchQuery) ||
      courier.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const courierDate = new Date(courier.created_at);
    const matchesDate = !dateRange?.from || (
      courierDate >= dateRange.from && 
      (!dateRange.to || courierDate <= dateRange.to)
    );
    
    return matchesSearch && matchesDate;
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredCouriers, itemsPerPage: 10 });

  const handleToggleActive = async (courierId: string, isActive: boolean) => {
    try {
      await updateCourier.mutateAsync({ id: courierId, is_active: !isActive });
      toast.success(isActive ? 'Kurir dinonaktifkan' : 'Kurir diaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status kurir');
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.full_name || !formData.phone) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }

    try {
      await createCourier.mutateAsync(formData);
      toast.success('Kurir berhasil ditambahkan');
      setDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan kurir');
    }
  };

  const handleEdit = async () => {
    if (!editFormData) return;

    try {
      await updateCourier.mutateAsync({
        id: editFormData.id,
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        vehicle_type: editFormData.vehicle_type || undefined,
        vehicle_plate: editFormData.vehicle_plate || undefined,
      });
      toast.success('Data kurir berhasil diperbarui');
      setEditDialogOpen(false);
      setEditFormData(null);
    } catch (error) {
      toast.error('Gagal memperbarui data kurir');
    }
  };

  const handleOpenEdit = (courier: NonNullable<typeof couriers>[0]) => {
    setEditFormData({
      id: courier.id,
      full_name: courier.full_name,
      phone: courier.phone,
      vehicle_type: courier.vehicle_type || '',
      vehicle_plate: courier.vehicle_plate || '',
    });
    setEditDialogOpen(true);
  };

  const handleExport = () => {
    if (!filteredCouriers) return;
    const data = filteredCouriers.map(c => ({
      Nama: c.full_name,
      Telepon: c.phone,
      'Tipe Kendaraan': c.vehicle_type || '-',
      'Plat Nomor': c.vehicle_plate || '-',
      'Total Pengiriman': c.total_deliveries,
      Status: c.is_active ? 'Aktif' : 'Nonaktif',
      'Tgl Bergabung': formatDate(new Date(c.created_at)),
    }));
    exportToCSV(data, `kurir-${formatDate(new Date())}`);
  };

  const activeCouriers = couriers?.filter(c => c.is_active).length || 0;
  const totalDeliveries = couriers?.reduce((sum, c) => sum + c.total_deliveries, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Kurir</h2>
        <p className="text-base text-gray-600">Pantau data kurir dan status keaktifan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Kurir</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{couriers?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-3">Terdaftar</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Kurir Aktif</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Truck className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{activeCouriers}</div>
            <p className="text-xs text-gray-600 mt-3">Siap antar</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DEF6FE', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Pengiriman</CardTitle>
            <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Package className="h-6 w-6 text-cyan-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{totalDeliveries}</div>
            <p className="text-xs text-gray-600 mt-3">Selesai diantar</p>
          </CardContent>
        </Card>
      </div>

      {/* Couriers Table */}
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                Daftar Kurir
              </CardTitle>
              <CardDescription className="mt-1 text-gray-500">Kelola data kurir dan status keaktifan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, telepon, plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-gray-200"
              />
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter tanggal"
              className="w-full md:w-auto"
            />
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={handleExport} 
                disabled={!filteredCouriers?.length}
                className="rounded-full border-gray-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="rounded-full bg-gray-900 hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kurir
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
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
                      <TableHead className="font-semibold text-gray-700">Kurir</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kendaraan</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Pengiriman</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-400">Tidak ada kurir ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData?.map((courier) => (
                        <TableRow key={courier.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">{courier.full_name}</p>
                              <p className="text-xs text-gray-500">
                                Bergabung {format(new Date(courier.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Phone className="h-3 w-3" />
                              {courier.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            {courier.vehicle_type ? (
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{courier.vehicle_type}</p>
                                <p className="text-xs text-gray-500 font-mono">{courier.vehicle_plate}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="rounded-full bg-blue-100 text-blue-700 font-semibold">{courier.total_deliveries}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={courier.is_active}
                              onCheckedChange={() => handleToggleActive(courier.id, courier.is_active)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-50 hover:text-purple-700"
                                onClick={() => handleOpenEdit(courier)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => setSelectedCourier(courier)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent style={{ borderRadius: '24px' }}>
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-gray-900">Detail Kurir</DialogTitle>
                                  </DialogHeader>
                                  {selectedCourier && (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                          <Truck className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div>
                                          <h3 className="font-bold text-lg text-gray-900">{selectedCourier.full_name}</h3>
                                          <p className="text-gray-600">{selectedCourier.phone}</p>
                                          <Badge 
                                            className={`mt-1 rounded-full ${
                                              selectedCourier.is_active 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-700'
                                            }`}
                                          >
                                            {selectedCourier.is_active ? 'Aktif' : 'Nonaktif'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Kendaraan</p>
                                          <p className="font-semibold text-gray-900">{selectedCourier.vehicle_type || '-'}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Plat Nomor</p>
                                          <p className="font-semibold font-mono text-gray-900">{selectedCourier.vehicle_plate || '-'}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 col-span-2">
                                          <p className="text-xs text-blue-700 mb-1">Total Pengiriman</p>
                                          <p className="font-bold text-2xl text-blue-900">{selectedCourier.total_deliveries}</p>
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-500 pt-2 border-t">
                                        Bergabung: {format(new Date(selectedCourier.created_at), 'dd MMMM yyyy', { locale: idLocale })}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
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

      {/* Create Courier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kurir Baru</DialogTitle>
            <DialogDescription>
              Buat akun kurir baru dengan mengisi data berikut
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="kurir@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nama lengkap kurir"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipe Kendaraan</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="Motor/Mobil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Plat Nomor</Label>
                <Input
                  id="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  placeholder="B 1234 ABC"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={createCourier.isPending}>
              {createCourier.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Courier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Kurir</DialogTitle>
            <DialogDescription>
              Perbarui informasi kurir
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nama Lengkap</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Nomor Telepon</Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_vehicle_type">Tipe Kendaraan</Label>
                  <Input
                    id="edit_vehicle_type"
                    value={editFormData.vehicle_type}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicle_type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_vehicle_plate">Plat Nomor</Label>
                  <Input
                    id="edit_vehicle_plate"
                    value={editFormData.vehicle_plate}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicle_plate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={updateCourier.isPending}>
              {updateCourier.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
