import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

// Orders
export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_profiles!orders_buyer_id_fkey(id, full_name, phone),
          courier:courier_profiles!orders_courier_id_fkey(id, full_name, phone),
          order_items(*, product:products(name, image_url)),
          order_address:order_addresses(*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, courierId }: { orderId: string; status: OrderStatus; courierId?: string }) => {
      const updateData: Record<string, unknown> = {};

      // If courier is being assigned
      if (courierId) {
        updateData.courier_id = courierId;
        updateData.assigned_at = new Date().toISOString();

        // Automatically set status to 'assigned' if current status is 'paid'
        // This ensures courier sees the order immediately
        if (status === 'paid') {
          updateData.status = 'assigned';
        } else {
          updateData.status = status;
        }
      } else {
        // If no courier, just update status
        updateData.status = status;
      }

      // Set timestamps based on status
      if (updateData.status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (updateData.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['courier-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
    },
  });
}

// Products
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          brand:brands(id, name),
          inventory(*),
          prices:product_prices(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      sku: string;
      description?: string;
      category_id?: string;
      brand_id?: string;
      image_url?: string;
      selling_price: number;
      hpp: number;
      initial_stock: number;
      min_stock: number;
    }) => {
      // Create product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          sku: product.sku,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          image_url: product.image_url,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: productData.id,
          quantity: product.initial_stock,
          min_stock: product.min_stock,
        });

      if (inventoryError) throw inventoryError;

      // Create price
      const { error: priceError } = await supabase
        .from('product_prices')
        .insert({
          product_id: productData.id,
          selling_price: product.selling_price,
          hpp_average: product.hpp,
        });

      if (priceError) throw priceError;

      return productData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: {
      id: string;
      name?: string;
      sku?: string;
      description?: string;
      category_id?: string;
      brand_id?: string;
      image_url?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// Inventory
export function useAdminInventory() {
  return useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(id, name, sku, image_url, is_active)
        `)
        .order('quantity', { ascending: true });

      if (error) throw error;
      return data?.filter(inv => inv.product?.is_active);
    },
  });
}

export function useInventoryMovements(productId?: string) {
  return useQuery({
    queryKey: ['inventory-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      movement_type: 'in' | 'out' | 'adjustment';
      quantity: number;
      reason: string;
      unit_cost?: number;
    }) => {
      // Get current inventory
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', movement.product_id)
        .single();

      if (invError) throw invError;

      const quantityBefore = inventory.quantity;
      let quantityAfter = quantityBefore;

      if (movement.movement_type === 'in') {
        quantityAfter = quantityBefore + movement.quantity;
      } else if (movement.movement_type === 'out') {
        quantityAfter = quantityBefore - movement.quantity;
      } else {
        quantityAfter = movement.quantity;
      }

      // Create movement record
      const { error: moveError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: movement.reason,
          unit_cost: movement.unit_cost,
        });

      if (moveError) throw moveError;

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: quantityAfter })
        .eq('product_id', movement.product_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
  });
}

// Couriers
export function useAdminCouriers() {
  return useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCourier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courier: {
      email: string;
      password: string;
      full_name: string;
      phone: string;
      vehicle_type?: string;
      vehicle_plate?: string;
    }) => {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: courier.email,
        password: courier.password,
        options: {
          data: {
            full_name: courier.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create courier profile
      const { data: profileData, error: profileError } = await supabase
        .from('courier_profiles')
        .insert({
          user_id: authData.user.id,
          full_name: courier.full_name,
          phone: courier.phone,
          vehicle_type: courier.vehicle_type,
          vehicle_plate: courier.vehicle_plate,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign courier role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'courier',
        });

      if (roleError) throw roleError;

      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-couriers'] });
    },
  });
}

export function useUpdateCourier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      is_active?: boolean;
      full_name?: string;
      phone?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
    }) => {
      const { data, error } = await supabase
        .from('courier_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-couriers'] });
    },
  });
}

// Customers (Buyers)
export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      // NOTE: Do not embed self-referential "referrer" relationship here.
      // The backend schema cache may not expose buyer_profiles -> buyer_profiles FK,
      // which causes PostgREST to return PGRST200 and the whole query fails.
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select(`
          *,
          domicile:domiciles(id, name),
          bank:banks(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}


export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      is_verified?: boolean;
      commission_balance?: number;
      commission_pending?: number;
    }) => {
      const { data, error } = await supabase
        .from('buyer_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
  });
}

// Categories
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Brands  
export function useAdminBrands() {
  return useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Dashboard Stats
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      // Get new orders count
      const { count: newOrdersCount, error: newOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      if (newOrdersError) throw newOrdersError;

      // Get active products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Get low stock items
      const { data: lowStock, error: lowStockError } = await supabase
        .from('inventory')
        .select('*, product:products(is_active)')
        .lt('quantity', 10);

      if (lowStockError) throw lowStockError;

      const lowStockCount = lowStock?.filter(inv => inv.product?.is_active).length || 0;

      const totalSales = todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      return {
        totalSalesToday: totalSales,
        newOrdersCount: newOrdersCount || 0,
        activeProductsCount: productsCount || 0,
        lowStockCount,
      };
    },
  });
}

// Product Prices
export function useUpdateProductPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priceData: {
      product_id: string;
      selling_price: number;
      hpp_average: number;
      het?: number;
    }) => {
      const { data, error } = await supabase
        .from('product_prices')
        .insert({
          product_id: priceData.product_id,
          selling_price: priceData.selling_price,
          hpp_average: priceData.hpp_average,
          het: priceData.het,
          effective_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-history'] });
    },
  });
}

export function useProductPriceHistory(productId: string) {
  return useQuery({
    queryKey: ['product-price-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', productId)
        .order('effective_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// Commissions
export function useAdminCommissions() {
  return useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_commissions')
        .select(`
          *,
          referrer:buyer_profiles!referral_commissions_referrer_id_fkey(id, full_name),
          buyer:buyer_profiles!referral_commissions_buyer_id_fkey(id, full_name),
          order:orders(id, order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
}

// Payouts
export function useAdminPayouts() {
  return useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_requests')
        .select(`
          *,
          buyer:buyer_profiles!payout_requests_buyer_id_fkey(id, full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: {
      id: string;
      status: 'approved' | 'rejected' | 'completed';
      rejection_reason?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.rejection_reason = rejection_reason;
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('payout_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
  });
}

// Reports & Analytics
export function useAdminReports(period: '7d' | '30d' | 'month') {
  return useQuery({
    queryKey: ['admin-reports', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      if (period === '7d') {
        startDate = subDays(now, 7);
      } else if (period === '30d') {
        startDate = subDays(now, 30);
      } else {
        startDate = startOfMonth(now);
      }

      // Get orders in period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(quantity, subtotal, product:products(name, category_id)),
          courier:courier_profiles(full_name)
        `)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Get previous period for comparison
      const prevStartDate = subDays(startDate, period === '7d' ? 7 : period === '30d' ? 30 : 30);
      const { data: prevOrders, error: prevError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      if (prevError) throw prevError;

      // Get inventory for stock levels
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*, product:products(name, sku, is_active)')
        .order('quantity', { ascending: true });

      if (invError) throw invError;

      // Get categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

      if (catError) throw catError;

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const prevRevenue = prevOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const uniqueBuyers = new Set(orders?.map(o => o.buyer_id)).size;

      // Daily sales data
      const days = eachDayOfInterval({ start: startDate, end: now });
      const dailySales = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayOrders = orders?.filter(o =>
          format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr
        ) || [];
        return {
          date: dayStr,
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          orders: dayOrders.length,
        };
      });

      // Sales by category
      const categoryMap = new Map<string, number>();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const catId = item.product?.category_id;
          if (catId) {
            categoryMap.set(catId, (categoryMap.get(catId) || 0) + Number(item.subtotal));
          }
        });
      });
      const salesByCategory = Array.from(categoryMap.entries()).map(([catId, value]) => ({
        name: categories?.find(c => c.id === catId)?.name || 'Lainnya',
        value,
      })).slice(0, 5);

      // Top products
      const productMap = new Map<string, { name: string; quantity: number }>();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.product?.name || 'Unknown';
          const existing = productMap.get(name) || { name, quantity: 0 };
          productMap.set(name, { name, quantity: existing.quantity + item.quantity });
        });
      });
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Orders by status
      const statusMap = new Map<string, number>();
      orders?.forEach(order => {
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      });
      const ordersByStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // Courier performance
      const courierMap = new Map<string, number>();
      orders?.filter(o => o.status === 'delivered' && o.courier).forEach(order => {
        const name = order.courier?.full_name || 'Unknown';
        courierMap.set(name, (courierMap.get(name) || 0) + 1);
      });
      const courierPerformance = Array.from(courierMap.entries())
        .map(([name, deliveries]) => ({ name, deliveries }))
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 5);

      // Stock levels
      const activeInventory = inventory?.filter(inv => inv.product?.is_active) || [];
      const lowStock = activeInventory.filter(inv => inv.quantity <= inv.min_stock).length;
      const mediumStock = activeInventory.filter(inv => inv.quantity > inv.min_stock && inv.quantity <= inv.min_stock * 2).length;
      const goodStock = activeInventory.filter(inv => inv.quantity > inv.min_stock * 2).length;
      const stockLevels = [
        { name: 'Stok Rendah', value: lowStock },
        { name: 'Stok Sedang', value: mediumStock },
        { name: 'Stok Cukup', value: goodStock },
      ];

      // Low stock products
      const lowStockProducts = activeInventory
        .filter(inv => inv.quantity <= inv.min_stock)
        .slice(0, 10)
        .map(inv => ({
          name: inv.product?.name || 'Unknown',
          sku: inv.product?.sku || '',
          quantity: inv.quantity,
          minStock: inv.min_stock,
        }));

      return {
        totalRevenue,
        revenueGrowth,
        totalOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue,
        activeBuyers: uniqueBuyers,
        dailySales,
        salesByCategory,
        topProducts,
        ordersByStatus,
        courierPerformance,
        stockLevels,
        lowStockProducts,
      };
    },
  });
}

// Audit Logs
export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });
}

// System Settings
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description, isNew }: {
      key: string;
      value: string;
      description?: string;
      isNew?: boolean;
    }) => {
      if (isNew) {
        const { data, error } = await supabase
          .from('system_settings')
          .insert({ key, value, description })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });
}

import { subDays, startOfMonth, eachDayOfInterval, format } from 'date-fns';
