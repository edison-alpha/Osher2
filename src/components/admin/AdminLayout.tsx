import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  Menu,
  X,
  CreditCard,
  Camera,
  Database,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Command
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OrderNotifications } from './OrderNotifications';
import { FloatingNotificationProvider } from './FloatingNotificationContainer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import logo
import osercLogo from '@/assets/oserc.svg';

const menuSections = [
  {
    title: 'Menu',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    ]
  },
  {
    title: 'Transaksi',
    collapsible: true,
    items: [
      { icon: ShoppingCart, label: 'Pesanan', path: '/admin/orders' },
      { icon: CreditCard, label: 'Pembayaran', path: '/admin/payments' },
      { icon: Camera, label: 'Bukti Kirim', path: '/admin/delivery-proofs' },
    ]
  },
  {
    title: 'Produk & Stok',
    collapsible: true,
    items: [
      { icon: Package, label: 'Produk', path: '/admin/products' },
      { icon: Box, label: 'Inventori', path: '/admin/inventory' },
      { icon: DollarSign, label: 'Harga & HPP', path: '/admin/pricing' },
    ]
  },
  {
    title: 'Pengguna',
    collapsible: true,
    items: [
      { icon: Users, label: 'Pelanggan', path: '/admin/customers' },
      { icon: Truck, label: 'Kurir', path: '/admin/couriers' },
      { icon: Wallet, label: 'Komisi', path: '/admin/commissions' },
    ]
  },
  {
    title: 'Sistem',
    collapsible: true,
    items: [
      { icon: BarChart3, label: 'Laporan', path: '/admin/reports' },
      { icon: FileText, label: 'Audit Log', path: '/admin/audit' },
      { icon: Database, label: 'Seed Data', path: '/admin/seeder' },
    ]
  }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <FloatingNotificationProvider>
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-[#F5F5F5] border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img 
                src={osercLogo} 
                alt="Logo" 
                className="h-9 w-9 object-contain"
              />
              <span className="text-base font-bold text-gray-900">OSHER ADMIN</span>
            </div>
          )}
          {sidebarCollapsed && (
            <img 
              src={osercLogo} 
              alt="Logo" 
              className="h-8 w-8 object-contain mx-auto"
            />
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-gray-600 hover:bg-gray-200 h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500",
          sidebarCollapsed ? "px-2" : "px-3"
        )}>
          {menuSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              {section.collapsible && !sidebarCollapsed ? (
                <>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-200/50 rounded-lg transition-colors"
                  >
                    <span>{section.title}</span>
                    {collapsedSections[section.title] ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                  {!collapsedSections[section.title] && (
                    <div className="mt-1 space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all text-left group",
                            isActive(item.path)
                              ? "bg-gray-900 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-colors",
                            isActive(item.path)
                              ? "bg-white/20"
                              : "bg-gray-300/50 group-hover:bg-gray-400/50"
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!sidebarCollapsed && !section.collapsible && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-900">
                      {section.title}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const menuButton = (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-full transition-all text-left group",
                            sidebarCollapsed ? "justify-center pl-1 pr-1 py-1" : "pl-1 pr-3 py-1",
                            isActive(item.path) && !sidebarCollapsed
                              ? "bg-gray-900 text-white shadow-sm"
                              : !isActive(item.path) && "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-colors",
                            isActive(item.path) && sidebarCollapsed
                              ? "bg-gray-900 text-white"
                              : isActive(item.path) && !sidebarCollapsed
                              ? "bg-white/20"
                              : "bg-gray-300/50 group-hover:bg-gray-400/50"
                          )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-sm font-medium">{item.label}</span>
                          )}
                        </button>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.path}>
                            <TooltipTrigger asChild>
                              {menuButton}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return menuButton;
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="shrink-0">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800 hover:text-white rounded-t-3xl rounded-b-none h-12"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Keluar
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-3 px-4 bg-gray-900 text-white hover:bg-gray-800 hover:text-white rounded-t-3xl rounded-b-none h-12"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Keluar</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Toggle Sidebar Button - Fixed on right side */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden lg:flex fixed top-[26px] z-50 items-center justify-center w-6 h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-r-lg shadow-lg transition-all duration-300",
              sidebarCollapsed ? "left-[80px]" : "left-[256px]"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Top Bar */}
        <header className="h-16 bg-[#F5F5F5] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-2xl ml-8">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900" />
              <Input
                type="text"
                placeholder="Search"
                className="w-full pl-12 pr-14 h-11 rounded-full bg-white border-gray-200 focus:border-gray-300 focus:ring-0 text-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <Command className="h-4 w-4 text-gray-900" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-gray-200 rounded-full"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="h-6 w-6 text-gray-900 fill-gray-900" />
            </Button>
            <OrderNotifications />
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-gray-200 hover:ring-gray-300 transition-all">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
              <AvatarFallback className="bg-gray-900 text-white text-sm font-semibold">
                {role?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 pt-6 lg:pt-8 bg-muted/30">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
    </TooltipProvider>
    </FloatingNotificationProvider>
  );
}
