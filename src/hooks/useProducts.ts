import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sku: string;
  category_id: string | null;
  brand_id: string | null;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  inventory?: { quantity: number; reserved_quantity: number } | null;
  product_prices?: { selling_price: number; hpp_average: number }[] | null;
}

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          image_url,
          sku,
          category_id,
          brand_id,
          categories:category_id (id, name),
          brands:brand_id (id, name),
          inventory (quantity, reserved_quantity),
          product_prices (selling_price, hpp_average)
        `)
        .eq('is_active', true)
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(product => ({
        ...product,
        category: Array.isArray(product.categories) ? product.categories[0] : product.categories,
        brand: Array.isArray(product.brands) ? product.brands[0] : product.brands,
        inventory: Array.isArray(product.inventory) ? product.inventory[0] : product.inventory,
        latestPrice: product.product_prices?.[0] || null,
        availableStock: ((Array.isArray(product.inventory) ? product.inventory[0] : product.inventory)?.quantity || 0) - 
                       ((Array.isArray(product.inventory) ? product.inventory[0] : product.inventory)?.reserved_quantity || 0),
      }));
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}
