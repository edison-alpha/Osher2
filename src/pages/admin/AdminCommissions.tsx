import { useState } from 'react';
import { 
  useAdminCommissions, 
  useAdminPayouts, 
  useUpdatePayoutStatus 
} from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Download
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const commissionTypeLabels: Record<string, string> = {
  accrual: 'Pendapatan',
  reversal: 'Pembatalan',
  payout: 'Pencairan',
};

const commissionTypeColors: Record<string, string> = {
  accrual: 'bg-success text-success-foreground',
  reversal: 'bg-destructive text-destructive-foreground',
  payout: 'bg-info text-info-foreground',
};

const payoutStatusLabels: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  completed: 'Selesai',
};

const payoutStatusColors: Record<string, string> = {
  pending: 'bg-warning text-warning-foreground',
  approved: 'bg-info text-info-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  completed: 'bg-success text-success-foreground',
};

export default function AdminCommissions() {
  const { data: commissions, isLoading: commissionsLoading } = useAdminCommissions();
  const { data: payouts, isLoading: payoutsLoading } = useAdminPayouts();
  const updatePayoutStatus = useUpdatePayoutStatus();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<typeof payouts extends (infer T)[] | undefined ? T : never>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCommissions = commissions?.filter(c =>
    c.referrer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayouts = payouts?.filter(p =>
    p.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.account_number.includes(searchQuery)
  );

  const {
    paginatedData: paginatedPayouts,
    currentPage: payoutPage,
    totalPages: payoutTotalPages,
    goToPage: goToPayoutPage,
    startIndex: payoutStartIndex,
    endIndex: payoutEndIndex,
    totalItems: payoutTotalItems,
  } = usePagination({ data: filteredPayouts, itemsPerPage: 10 });

  const {
    paginatedData: paginatedCommissions,
    currentPage: commPage,
    totalPages: commTotalPages,
    goToPage: goToCommPage,
    startIndex: commStartIndex,
    endIndex: commEndIndex,
    totalItems: commTotalItems,
  } = usePagination({ data: filteredCommissions, itemsPerPage: 10 });

  const handleExportPayouts = () => {
    if (!filteredPayouts) return;
    const data = filteredPayouts.map(p => ({
      Pembeli: p.buyer?.full_name || '-',
      Bank: p.bank_name,
      'No Rekening': p.account_number,
      'Nama Rekening': p.account_name,
      Jumlah: Number(p.amount),
      Status: payoutStatusLabels[p.status],
      Tanggal: formatDate(new Date(p.created_at)),
    }));
    exportToCSV(data, `payout-${formatDate(new Date())}`);
  };

  const handleExportCommissions = () => {
    if (!filteredCommissions) return;
    const data = filteredCommissions.map(c => ({
      Referrer: c.referrer?.full_name || '-',
      Pembeli: c.buyer?.full_name || '-',
      Tipe: commissionTypeLabels[c.commission_type],
      Jumlah: Number(c.amount),
      Persentase: c.percentage ? `${c.percentage}%` : '-',
      'Subtotal Order': c.order_subtotal || 0,
      Tanggal: formatDate(new Date(c.created_at)),
    }));
    exportToCSV(data, `komisi-${formatDate(new Date())}`);
  };

  const handlePayoutAction = (payout: typeof payouts extends (infer T)[] | undefined ? T : never, action: 'approve' | 'reject' | 'complete') => {
    setSelectedPayout(payout);
    setActionType(action);
    setRejectionReason('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPayout) return;

    try {
      await updatePayoutStatus.mutateAsync({
        id: selectedPayout.id,
        status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'completed',
        rejection_reason: actionType === 'reject' ? rejectionReason : undefined,
      });
      toast.success(
        actionType === 'approve' ? 'Payout disetujui' :
        actionType === 'reject' ? 'Payout ditolak' :
        'Payout selesai diproses'
      );
      setActionDialogOpen(false);
    } catch (error) {
      toast.error('Gagal memproses payout');
    }
  };

  // Stats
  const totalCommissions = commissions?.filter(c => c.commission_type === 'accrual')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const totalPayouts = payouts?.filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingPayouts = payouts?.filter(p => p.status === 'pending').length || 0;
  const pendingPayoutAmount = payouts?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Kelola Komisi & Payout</h2>
        <p className="text-base text-gray-600">Pantau komisi referral dan proses pencairan dana</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Komisi</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-gray-600 mt-3">Sepanjang waktu</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DEF6FE', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Dicairkan</CardTitle>
            <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-cyan-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayouts)}</div>
            <p className="text-xs text-gray-600 mt-3">Sudah dibayarkan</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFF4E6', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Payout</CardTitle>
            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{pendingPayouts}</div>
            <p className="text-xs text-gray-600 mt-3">Menunggu approval</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFE6E7', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Jumlah Pending</CardTitle>
            <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-pink-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(pendingPayoutAmount)}</div>
            <p className="text-xs text-gray-600 mt-3">Perlu diproses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full bg-gray-100 p-1">
          <TabsTrigger value="payouts" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4" />
            Permintaan Payout
            {pendingPayouts > 0 && (
              <Badge className="ml-1 rounded-full bg-red-500 text-white">{pendingPayouts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Riwayat Komisi
          </TabsTrigger>
        </TabsList>

        {/* Payout Requests Tab */}
        <TabsContent value="payouts">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
            <CardHeader className="border-b border-gray-100 pb-5 pt-6">
              <CardTitle className="text-gray-900 text-lg font-bold">Permintaan Pencairan</CardTitle>
              <CardDescription className="text-gray-500">Kelola permintaan pencairan komisi dari pembeli</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, bank, nomor rekening..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-full border-gray-200"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportPayouts} 
                  disabled={!filteredPayouts?.length}
                  className="rounded-full border-gray-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              {payoutsLoading ? (
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
                          <TableHead className="font-semibold text-gray-700">Pembeli</TableHead>
                          <TableHead className="font-semibold text-gray-700">Rekening Tujuan</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Jumlah</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayouts?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400">Tidak ada permintaan payout</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedPayouts?.map((payout) => (
                            <TableRow key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <span className="font-semibold text-gray-900">{payout.buyer?.full_name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Building className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{payout.bank_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {payout.account_number} - {payout.account_name}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-bold text-gray-900">{formatCurrency(Number(payout.amount))}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`rounded-full font-medium ${
                                  payout.status === 'pending' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : payout.status === 'approved' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : payout.status === 'rejected' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {payoutStatusLabels[payout.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(payout.created_at), 'dd MMM yyyy', { locale: idLocale })}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {payout.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                        onClick={() => handlePayoutAction(payout, 'approve')}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Setujui
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        onClick={() => handlePayoutAction(payout, 'reject')}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Tolak
                                      </Button>
                                    </>
                                  )}
                                  {payout.status === 'approved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePayoutAction(payout, 'complete')}
                                      className="rounded-full border-gray-200"
                                    >
                                      Selesaikan
                                    </Button>
                                  )}
                                  {payout.status === 'rejected' && payout.rejection_reason && (
                                    <span className="text-xs text-gray-500 max-w-[150px] truncate">
                                      {payout.rejection_reason}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {payoutTotalPages > 1 && (
                    <div className="mt-4">
                      <DataPagination
                        currentPage={payoutPage}
                        totalPages={payoutTotalPages}
                        onPageChange={goToPayoutPage}
                        startIndex={payoutStartIndex}
                        endIndex={payoutEndIndex}
                        totalItems={payoutTotalItems}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission History Tab */}
        <TabsContent value="commissions">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
            <CardHeader className="border-b border-gray-100 pb-5 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-gray-900 text-lg font-bold">Riwayat Komisi</CardTitle>
                  <CardDescription className="text-gray-500">Semua transaksi komisi referral</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportCommissions} 
                  disabled={!filteredCommissions?.length}
                  className="rounded-full border-gray-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama referrer atau pembeli..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-full border-gray-200"
                  />
                </div>
              </div>

              {commissionsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-gray-700">Referrer</TableHead>
                          <TableHead className="font-semibold text-gray-700">Pembeli</TableHead>
                          <TableHead className="font-semibold text-gray-700">Tipe</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Jumlah</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">% Komisi</TableHead>
                          <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCommissions?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-400">Tidak ada riwayat komisi</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedCommissions?.map((commission) => (
                            <TableRow key={commission.id} className="hover:bg-gray-50/50 transition-colors">
                              <TableCell>
                                <span className="font-semibold text-gray-900">{commission.referrer?.full_name || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-600">{commission.buyer?.full_name || '-'}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {commission.commission_type === 'accrual' ? (
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : commission.commission_type === 'reversal' ? (
                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Wallet className="h-4 w-4 text-blue-600" />
                                    </div>
                                  )}
                                  <Badge className={`rounded-full font-medium ${
                                    commission.commission_type === 'accrual' 
                                      ? 'bg-green-100 text-green-700' 
                                      : commission.commission_type === 'reversal' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {commissionTypeLabels[commission.commission_type]}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${
                                  commission.commission_type === 'accrual' ? 'text-green-600' : 
                                  commission.commission_type === 'reversal' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {commission.commission_type === 'reversal' ? '-' : '+'}
                                  {formatCurrency(Number(commission.amount))}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {commission.percentage ? (
                                  <span className="text-gray-600 font-medium">{commission.percentage}%</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: idLocale })}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {commTotalPages > 1 && (
                    <div className="mt-4">
                      <DataPagination
                        currentPage={commPage}
                        totalPages={commTotalPages}
                        onPageChange={goToCommPage}
                        startIndex={commStartIndex}
                        endIndex={commEndIndex}
                        totalItems={commTotalItems}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {actionType === 'approve' && 'Setujui Payout'}
              {actionType === 'reject' && 'Tolak Payout'}
              {actionType === 'complete' && 'Selesaikan Payout'}
            </DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Pembeli</span>
                  <span className="font-bold text-gray-900">{selectedPayout.buyer?.full_name}</span>
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Bank</span>
                  <span className="font-semibold text-gray-900">{selectedPayout.bank_name}</span>
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">No. Rekening</span>
                  <span className="font-mono font-semibold text-gray-900">{selectedPayout.account_number}</span>
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Nama Rekening</span>
                  <span className="font-semibold text-gray-900">{selectedPayout.account_name}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-600 text-sm">Jumlah</span>
                  <span className="font-bold text-xl text-gray-900">{formatCurrency(Number(selectedPayout.amount))}</span>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Alasan Penolakan</label>
                  <Textarea
                    placeholder="Masukkan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              )}

              {actionType === 'approve' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Setelah disetujui, Anda perlu melakukan transfer manual ke rekening pembeli, 
                    lalu klik "Selesaikan" untuk menyelesaikan proses payout.
                  </p>
                </div>
              )}

              {actionType === 'complete' && (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-200">
                  <p className="text-sm text-green-900">
                    Pastikan Anda sudah melakukan transfer ke rekening pembeli sebelum menyelesaikan payout ini.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setActionDialogOpen(false)}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={updatePayoutStatus.isPending || (actionType === 'reject' && !rejectionReason)}
              className={`rounded-full ${
                actionType === 'reject' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {updatePayoutStatus.isPending ? 'Memproses...' : 
                actionType === 'approve' ? 'Setujui' :
                actionType === 'reject' ? 'Tolak' :
                'Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
