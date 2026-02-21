import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  FileText, 
  Eye,
  User,
  Package,
  ShoppingCart,
  Settings,
  Truck,
  Wallet,
  Clock,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/shared/DataPagination';
import { exportToCSV, formatDate } from '@/lib/exportUtils';

const entityTypeLabels: Record<string, string> = {
  orders: 'Pesanan',
  products: 'Produk',
  inventory: 'Inventori',
  buyer_profiles: 'Pelanggan',
  courier_profiles: 'Kurir',
  payout_requests: 'Payout',
  system_settings: 'Pengaturan',
};

const entityTypeIcons: Record<string, React.ReactNode> = {
  orders: <ShoppingCart className="h-4 w-4" />,
  products: <Package className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  buyer_profiles: <User className="h-4 w-4" />,
  courier_profiles: <Truck className="h-4 w-4" />,
  payout_requests: <Wallet className="h-4 w-4" />,
  system_settings: <Settings className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-success text-success-foreground',
  update: 'bg-info text-info-foreground',
  delete: 'bg-destructive text-destructive-foreground',
  insert: 'bg-success text-success-foreground',
};

export default function AdminAuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { data: logs, isLoading } = useAdminAuditLogs();
  const [selectedLog, setSelectedLog] = useState<typeof logs extends (infer T)[] | undefined ? T : never>(null);

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.includes(searchQuery);
    
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredLogs, itemsPerPage: 20 });

  const handleExport = () => {
    if (!filteredLogs) return;
    const data = filteredLogs.map(l => ({
      Waktu: formatDate(new Date(l.created_at)),
      Entitas: entityTypeLabels[l.entity_type] || l.entity_type,
      Aksi: l.action.toUpperCase(),
      'Entity ID': l.entity_id,
      'IP Address': l.ip_address || '-',
    }));
    exportToCSV(data, `audit-log-${formatDate(new Date())}`);
  };

  const formatJsonValue = (value: any) => {
    if (!value) return '-';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Audit Log</h2>
        <p className="text-base text-gray-600">Riwayat semua aktivitas sistem</p>
      </div>

      {/* Header Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#E6E6FF', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Log</CardTitle>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">{logs?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-3">Aktivitas tercatat</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#FFF4E6', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Hari Ini</CardTitle>
            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">
              {logs?.filter(l => 
                format(new Date(l.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-3">Aktivitas hari ini</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-0" style={{ backgroundColor: '#DAFFF9', borderRadius: '32px' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Tipe Entitas</CardTitle>
            <div className="h-12 w-12 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Settings className="h-6 w-6 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="text-2xl font-bold text-gray-900">
              {new Set(logs?.map(l => l.entity_type)).size || 0}
            </div>
            <p className="text-xs text-gray-600 mt-3">Jenis entitas</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow" style={{ borderRadius: '32px' }}>
        <CardHeader className="border-b border-gray-100 pb-5 pt-6">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Audit Log
          </CardTitle>
          <CardDescription className="text-gray-500">Riwayat semua aktivitas sistem</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari entity ID atau tipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-gray-200"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-gray-200">
                <SelectValue placeholder="Filter Entitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Entitas</SelectItem>
                <SelectItem value="orders">Pesanan</SelectItem>
                <SelectItem value="products">Produk</SelectItem>
                <SelectItem value="inventory">Inventori</SelectItem>
                <SelectItem value="buyer_profiles">Pelanggan</SelectItem>
                <SelectItem value="courier_profiles">Kurir</SelectItem>
                <SelectItem value="payout_requests">Payout</SelectItem>
                <SelectItem value="system_settings">Pengaturan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] rounded-full border-gray-200">
                <SelectValue placeholder="Filter Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="insert">Insert</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!filteredLogs?.length}
              className="rounded-full border-gray-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Waktu</TableHead>
                      <TableHead className="font-semibold text-gray-700">Entitas</TableHead>
                      <TableHead className="font-semibold text-gray-700">Aksi</TableHead>
                      <TableHead className="font-semibold text-gray-700">Entity ID</TableHead>
                      <TableHead className="font-semibold text-gray-700">IP Address</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-400">Tidak ada log ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData?.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {format(new Date(log.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(log.created_at), 'HH:mm:ss')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                {entityTypeIcons[log.entity_type] || <FileText className="h-4 w-4 text-blue-600" />}
                              </div>
                              <span className="font-medium text-gray-900">{entityTypeLabels[log.entity_type] || log.entity_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`rounded-full font-medium ${
                              log.action === 'create' || log.action === 'insert'
                                ? 'bg-green-100 text-green-700'
                                : log.action === 'update'
                                ? 'bg-blue-100 text-blue-700'
                                : log.action === 'delete'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {log.action.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-600">{log.entity_id.slice(0, 8)}...</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {log.ip_address || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedLog(log)}
                                  className="rounded-full hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh]" style={{ borderRadius: '24px' }}>
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold text-gray-900">Detail Audit Log</DialogTitle>
                                </DialogHeader>
                                {selectedLog && (
                                  <ScrollArea className="max-h-[60vh]">
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Waktu</p>
                                          <p className="font-semibold text-gray-900">
                                            {format(new Date(selectedLog.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: idLocale })}
                                          </p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Aksi</p>
                                          <Badge className={`rounded-full font-medium ${
                                            selectedLog.action === 'create' || selectedLog.action === 'insert'
                                              ? 'bg-green-100 text-green-700'
                                              : selectedLog.action === 'update'
                                              ? 'bg-blue-100 text-blue-700'
                                              : selectedLog.action === 'delete'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {selectedLog.action.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Entitas</p>
                                          <p className="font-semibold text-gray-900">{entityTypeLabels[selectedLog.entity_type] || selectedLog.entity_type}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">Entity ID</p>
                                          <p className="font-mono text-sm break-all text-gray-900">{selectedLog.entity_id}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">IP Address</p>
                                          <p className="font-semibold text-gray-900">{selectedLog.ip_address || '-'}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-1">User Agent</p>
                                          <p className="text-xs truncate text-gray-700">{selectedLog.user_agent || '-'}</p>
                                        </div>
                                      </div>

                                      {selectedLog.old_value && (
                                        <div className="p-4 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-2 font-semibold">Nilai Lama</p>
                                          <pre className="text-xs bg-white p-3 rounded-xl overflow-x-auto border border-gray-200">
                                            {formatJsonValue(selectedLog.old_value)}
                                          </pre>
                                        </div>
                                      )}

                                      {selectedLog.new_value && (
                                        <div className="p-4 rounded-2xl bg-gray-50">
                                          <p className="text-xs text-gray-500 mb-2 font-semibold">Nilai Baru</p>
                                          <pre className="text-xs bg-white p-3 rounded-xl overflow-x-auto border border-gray-200">
                                            {formatJsonValue(selectedLog.new_value)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
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
