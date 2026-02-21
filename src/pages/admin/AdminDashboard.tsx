import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Wallet, 
  Settings, 
  LogOut,
  BarChart3,
  FileText,
  Box,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading, role } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && role && !['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) {
      // Redirect to appropriate dashboard
      if (role === 'buyer') navigate('/buyer');
      else if (role === 'courier') navigate('/courier');
    }
  }, [user, loading, role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', description: 'Ringkasan bisnis' },
    { icon: ShoppingCart, label: 'Pesanan', description: 'Kelola pesanan' },
    { icon: Package, label: 'Produk', description: 'Kelola produk' },
    { icon: Box, label: 'Inventori', description: 'Stok & mutasi' },
    { icon: DollarSign, label: 'Harga & HPP', description: 'Kelola harga' },
    { icon: Users, label: 'Pelanggan', description: 'Data pembeli' },
    { icon: Truck, label: 'Kurir', description: 'Data pengirim' },
    { icon: Wallet, label: 'Komisi', description: 'Referral & payout' },
    { icon: TrendingUp, label: 'Keuangan', description: 'Laporan kas' },
    { icon: BarChart3, label: 'Laporan', description: 'Analytics' },
    { icon: FileText, label: 'Audit Log', description: 'Riwayat aktivitas' },
    { icon: Settings, label: 'Pengaturan', description: 'Konfigurasi sistem' },
  ];

  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden lg:block">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">RetailPOS</span>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">Dashboard Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground capitalize">
              {role?.replace('_', ' ')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="lg:hidden">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 0</div>
                <p className="text-xs text-muted-foreground">Hari ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pesanan Baru</CardTitle>
                <ShoppingCart className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Menunggu konfirmasi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
                <Package className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Tersedia di katalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
                <Box className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Perlu restok</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Menu Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.slice(1).map((item) => (
              <Card 
                key={item.label}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
              >
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
