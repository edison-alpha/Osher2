import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { OrderRealtimeProvider } from "@/components/buyer/OrderRealtimeProvider";
import { CourierRealtimeProvider } from "@/components/courier/CourierRealtimeProvider";
import { AdminRealtimeProvider } from "@/components/admin/AdminRealtimeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InstallPWA } from "@/components/shared/InstallPWA";
import { AdminRoute, BuyerRoute, CourierRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import Catalog from "./pages/buyer/Catalog";
import ProductDetail from "./pages/buyer/ProductDetail";
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import Orders from "./pages/buyer/Orders";
import OrderDetail from "./pages/buyer/OrderDetail";
import BuyerProfile from "./pages/buyer/Profile";
import TransactionDetail from "./pages/buyer/TransactionDetail";
import CourierDashboard from "./pages/courier/CourierDashboard";
import ActiveOrders from "./pages/courier/ActiveOrders";
import OrderHistory from "./pages/courier/OrderHistory";
import CourierProfile from "./pages/courier/CourierProfile";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminCouriers from "./pages/admin/AdminCouriers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminReports from "./pages/admin/AdminReports";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDeliveryProofs from "./pages/admin/AdminDeliveryProofs";
import AdminSeeder from "./pages/admin/AdminSeeder";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <OrderRealtimeProvider>
          <CourierRealtimeProvider>
            <AdminRealtimeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <InstallPWA />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Protected Buyer Routes */}
                    <Route element={<BuyerRoute />}>
                      <Route path="/buyer" element={<BuyerDashboard />} />
                      <Route path="/buyer/catalog" element={<Catalog />} />
                      <Route path="/buyer/product/:productId" element={<ProductDetail />} />
                      <Route path="/buyer/cart" element={<Cart />} />
                      <Route path="/buyer/checkout" element={<Checkout />} />
                      <Route path="/buyer/orders" element={<Orders />} />
                      <Route path="/buyer/orders/:orderId" element={<OrderDetail />} />
                      <Route path="/buyer/profile" element={<BuyerProfile />} />
                      <Route path="/buyer/transaction/:type/:id" element={<TransactionDetail />} />
                    </Route>
                    
                    {/* Protected Courier Routes */}
                    <Route element={<CourierRoute />}>
                      <Route path="/courier" element={<CourierDashboard />} />
                      <Route path="/courier/active" element={<ActiveOrders />} />
                      <Route path="/courier/history" element={<OrderHistory />} />
                      <Route path="/courier/profile" element={<CourierProfile />} />
                    </Route>
                    
                    {/* Protected Admin Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminOverview />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="delivery-proofs" element={<AdminDeliveryProofs />} />
                        <Route path="inventory" element={<AdminInventory />} />
                        <Route path="pricing" element={<AdminPricing />} />
                        <Route path="couriers" element={<AdminCouriers />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="commissions" element={<AdminCommissions />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="audit" element={<AdminAuditLog />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="seeder" element={<AdminSeeder />} />
                      </Route>
                    </Route>
                    
                    <Route path="/install" element={<Install />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AdminRealtimeProvider>
          </CourierRealtimeProvider>
        </OrderRealtimeProvider>
      </CartProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
