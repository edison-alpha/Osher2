import { useState } from 'react';
import { useAdminCustomers, useUpdateCustomer } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, Users, UserCheck, Wallet, Phone, CreditCard, Building, Download } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { exportToCSV, formatCurrency as formatCurrencyUtil, formatDate } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers();
  const updateCustomer = useUpdateCustomer();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers extends (infer T)[] | undefined ? T : never>(null);

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = 
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.nik.includes(searchQuery);
    
    const customerDate = new Date(customer.created_at);
    const matchesDate = !dateRange?.from || (
      customerDate >= dateRange.from && 
      (!dateRange.to || customerDate <= dateRange.to)
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
  } = usePagination({ data: filteredCustomers, itemsPerPage: 10 });

  const handleExport = () => {
    if (!filteredCustomers) return;
    const data = filteredCustomers.map(c => ({
      Nama: c.full_name,
      NIK: c.nik,
      Telepon: c.phone || '-',
      Domisili: c.domicile?.name || '-',
      'Saldo Komisi': Number(c.commission_balance),
      'Komisi Pending': Number(c.commission_pending),
      Terverifikasi: c.is_verified ? 'Ya' : 'Tidak',
      'Tgl Bergabung': formatDate(new Date(c.created_at)),
    }));
    exportToCSV(data, `pelanggan-${formatDate(new Date())}`);
  };

  const handleToggleVerified = async (customerId: string, isVerified: boolean) => {
    try {
      await updateCustomer.mutateAsync({ id: customerId, is_verified: !isVerified });
      toast.success(isVerified ? 'Verifikasi pelanggan dicabut' : 'Pelanggan terverifikasi');
    } catch (error) {
      toast.error('Gagal mengubah status verifikasi');
    }
  };

  const verifiedCustomers = customers?.filter(c => c.is_verified).length || 0;
  const totalCommissionBalance = customers?.reduce((sum, c) => sum + Number(c.commission_balance), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Pelanggan</h2>
        <p className="text-base text-gray-600">Pantau data pelanggan dan status verifikasi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Pelanggan</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{customers?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-3">Terdaftar</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Terverifikasi</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{verifiedCustomers}</div>
            <p className="text-xs text-gray-600 mt-3">Akun verified</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFF4E6', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Saldo Komisi</CardTitle>
            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalCommissionBalance)}</div>
            <p className="text-xs text-gray-600 mt-3">Saldo tersedia</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Daftar Pelanggan
              </CardTitle>
              <CardDescription className="mt-1 text-gray-500">Kelola data pelanggan dan status verifikasi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, telepon, NIK..."
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
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!filteredCustomers?.length}
              className="rounded-full border-gray-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
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
                      <TableHead className="font-semibold text-gray-700">Pelanggan</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                      <TableHead className="font-semibold text-gray-700">NIK</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Saldo Komisi</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Verifikasi</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-400">Tidak ada pelanggan ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData?.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">{customer.full_name}</p>
                              <p className="text-xs text-gray-500">
                                Bergabung {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone ? (
                              <div className="flex items-center gap-1 text-sm text-gray-700">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-700">{customer.nik}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-bold text-gray-900">{formatCurrency(Number(customer.commission_balance))}</p>
                              {Number(customer.commission_pending) > 0 && (
                                <p className="text-xs text-gray-500">
                                  Pending: {formatCurrency(Number(customer.commission_pending))}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={customer.is_verified}
                              onCheckedChange={() => handleToggleVerified(customer.id, customer.is_verified)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg" style={{ borderRadius: '24px' }}>
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold text-gray-900">Detail Pelanggan</DialogTitle>
                                </DialogHeader>
                                {selectedCustomer && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                        <Users className="h-8 w-8 text-blue-600" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-lg text-gray-900">{selectedCustomer.full_name}</h3>
                                        <p className="text-gray-600">{selectedCustomer.phone || 'No phone'}</p>
                                        <Badge 
                                          className={`mt-1 rounded-full ${
                                            selectedCustomer.is_verified 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {selectedCustomer.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-3 rounded-2xl bg-gray-50">
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                          <CreditCard className="h-3 w-3" /> NIK
                                        </p>
                                        <p className="font-mono font-semibold text-sm text-gray-900">{selectedCustomer.nik}</p>
                                      </div>
                                      <div className="p-3 rounded-2xl bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Domisili</p>
                                        <p className="font-semibold text-sm text-gray-900">
                                          {selectedCustomer.domicile?.name || '-'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
                                        <p className="text-xs text-green-700 mb-1">Saldo Komisi</p>
                                        <p className="font-bold text-green-900">
                                          {formatCurrency(Number(selectedCustomer.commission_balance))}
                                        </p>
                                      </div>
                                      <div className="p-3 rounded-2xl bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Komisi Pending</p>
                                        <p className="font-semibold text-gray-900">
                                          {formatCurrency(Number(selectedCustomer.commission_pending))}
                                        </p>
                                      </div>
                                    </div>

                                    {selectedCustomer.bank && (
                                      <div className="p-3 rounded-2xl bg-gray-50">
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                          <Building className="h-3 w-3" /> Rekening Bank
                                        </p>
                                        <p className="font-semibold text-gray-900">{selectedCustomer.bank.name}</p>
                                        <p className="text-sm text-gray-700">{selectedCustomer.bank_account_name}</p>
                                        <p className="text-sm font-mono text-gray-700">{selectedCustomer.bank_account_number}</p>
                                      </div>
                                    )}

                                    <div className="text-sm text-gray-500 pt-2 border-t">
                                      Bergabung: {format(new Date(selectedCustomer.created_at), 'dd MMMM yyyy', { locale: idLocale })}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
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
    </div>
  );
}
