import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Truck, Plus, Check, X, Flame, Wind, Sparkles, Cigarette, Grid3x3, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FloatingNav } from '@/components/buyer/FloatingNav';
import { NotificationDropdown } from '@/components/buyer/NotificationDropdown';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import images
import kretekImg from '@/assets/kretek.png';
import mildImg from '@/assets/mild.png';
import mentolImg from '@/assets/mentol.png';

// Warna background untuk product cards
const bgColors = ['bg-[#F3E5D8]', 'bg-[#DBCFB0]', 'bg-[#E9DCC9]', 'bg-[#D7BEA8]'];

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { items, addItem, removeItem } = useCart();

  const { data: products, isLoading: productsLoading } = useProducts(selectedCategory);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save search to history
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Get search suggestions based on products
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !products) return [];
    const query = searchQuery.toLowerCase();

    // Get unique product names that match
    const productMatches = products
      .filter(p => p.name.toLowerCase().includes(query))
      .map(p => p.name)
      .slice(0, 5);

    // Get unique category names that match
    const categoryMatches = categories
      ?.filter(c => c.name.toLowerCase().includes(query))
      .map(c => c.name)
      .slice(0, 3) || [];

    return [...new Set([...productMatches, ...categoryMatches])];
  }, [searchQuery, products, categories]);

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    saveSearchHistory(query);
    setShowSearchDropdown(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery);
      setShowSearchDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Icon mapping for categories
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('kretek')) return Flame;
    if (name.includes('mild') || name.includes('light')) return Wind;
    if (name.includes('menthol') || name.includes('mentol')) return Sparkles;
    if (name.includes('filter')) return Cigarette;
    return Package;
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const productCount = filteredProducts.length;
  const inStockCount = filteredProducts.filter(p => p.availableStock > 0).length;
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any) => {
    const isInCart = items.some(item => item.productId === product.id);

    if (isInCart) {
      removeItem(product.id);
      toast({
        title: "Dihapus dari Keranjang",
        description: `${product.name} telah dihapus`,
        duration: 2000,
      });
      return;
    }

    if (product.availableStock <= 0) {
      toast({
        title: "Stok Habis",
        description: "Produk ini sedang tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.latestPrice?.selling_price || 0,
      imageUrl: product.image_url,
      stock: product.availableStock,
    });

    toast({
      title: "Ditambahkan ke Keranjang!",
      description: `${product.name} berhasil ditambahkan`,
      duration: 2000,
    });
  };

  // Assign background colors and dummy data to products
  const productsWithBg = filteredProducts.map((product, index) => {
    const dummySold = (parseInt(product.id.slice(-3), 16) % 500) + 10;

    return {
      ...product,
      bgColor: bgColors[index % bgColors.length],
      totalSold: dummySold
    };
  });

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-32">
      <div className="max-w-md mx-auto px-4" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[22px] font-bold leading-[1.1] tracking-tight text-[#111111]">
              Katalog Produk
            </h1>
            <NotificationDropdown />
          </div>
          <p className="text-[13px] text-[#8E8E93] leading-relaxed">
            Temukan produk terbaik dengan harga kompetitif
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6" ref={searchRef}>
          <Input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            className="w-full bg-white border-none rounded-full py-2.5 pl-5 pr-[52px] focus-visible:ring-1 focus-visible:ring-black/5 placeholder-gray-400 text-sm shadow-sm h-11"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[#111111] hover:bg-black transition-colors"
            >
              <X className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[#111111]">
              <Search className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
            </div>
          )}

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearchDropdown && (searchQuery || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                style={{ width: '100%' }}
              >
                {/* Search Suggestions */}
                {searchQuery && searchSuggestions.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                      <TrendingUp className="w-4 h-4" />
                      Saran Pencarian
                    </div>
                    {searchSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSearchSelect(suggestion)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Search History */}
                {!searchQuery && searchHistory.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                        <Clock className="w-4 h-4" />
                        Pencarian Terakhir
                      </div>
                      <button
                        onClick={clearSearchHistory}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                    {searchHistory.map((history, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSearchSelect(history)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{history}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchQuery && searchSuggestions.length === 0 && (
                  <div className="py-8 px-4 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Tidak ada hasil untuk "{searchQuery}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                "shrink-0 rounded-full text-[11px] font-semibold transition-all flex items-center gap-2",
                !selectedCategory
                  ? "bg-[#111111] text-white shadow-md pl-1 pr-4 py-1"
                  : "bg-white text-[#8E8E93] hover:bg-gray-50 pl-1 pr-4 py-1"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center",
                !selectedCategory ? "bg-white" : "bg-[#111111]"
              )}>
                <Grid3x3 className={cn(
                  "h-[14px] w-[14px]",
                  !selectedCategory ? "text-[#111111]" : "text-white"
                )} strokeWidth={2.5} />
              </div>
              Semua
            </button>
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-24 h-9 bg-gray-200 rounded-full animate-pulse" />
              ))
            ) : (
              categories?.map((category) => {
                const CategoryIcon = getCategoryIcon(category.name);
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "shrink-0 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                      isSelected
                        ? "bg-[#111111] text-white shadow-md pl-1 pr-4 py-1"
                        : "bg-white text-[#8E8E93] hover:bg-gray-50 pl-1 pr-4 py-1"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      isSelected ? "bg-white" : "bg-[#111111]"
                    )}>
                      <CategoryIcon className={cn(
                        "h-[14px] w-[14px]",
                        isSelected ? "text-[#111111]" : "text-white"
                      )} strokeWidth={2.5} />
                    </div>
                    {category.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Product Count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[#111111]">
            {productsLoading ? (
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                {productCount} Produk
                {searchQuery && ` untuk "${searchQuery}"`}
              </>
            )}
          </h2>
          {!productsLoading && inStockCount < productCount && (
            <span className="text-[10px] text-[#8E8E93]">
              {inStockCount} tersedia
            </span>
          )}
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <motion.div
            className="grid grid-cols-2 gap-x-2 gap-y-4 -mx-4 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="bg-slate-200 animate-pulse rounded-[2rem] p-4 mb-3 relative aspect-[4/5]"></div>
                <div className="px-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : productsWithBg.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-[16px] font-bold text-[#111111] mb-2">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-[13px] text-[#8E8E93] text-center max-w-xs mb-4">
              {searchQuery
                ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                : 'Tidak ada produk dalam kategori ini'}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(undefined);
                }}
                className="bg-[#111111] text-white px-6 py-2.5 rounded-full text-[11px] font-semibold transition-transform active:scale-95"
              >
                Reset Filter
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-x-2 gap-y-4 -mx-4 px-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {productsWithBg.map((product, index) => (
              <motion.div
                key={product.id}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -5 }}
                layout
              >
                <Link to={`/buyer/product/${product.id}`}>
                  <div className="rounded-3xl overflow-hidden shadow-sm bg-white">
                    {/* Image Container */}
                    <div className={cn(
                      "relative aspect-[4/4] overflow-hidden rounded-b-3xl",
                      product.bgColor
                    )}>

                      {product.image_url ? (
                        <div className="relative w-full h-full">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl opacity-30">📦</span>
                        </div>
                      )}

                      {/* Badge */}
                      <div className="absolute bottom-0 left-0">
                        <div className="bg-[#2E7D32] text-white text-[8px] font-bold py-1.5 px-3 flex items-center gap-1 rounded-tr-lg">
                          <Truck className="w-3 h-3" strokeWidth={2.5} />
                          <span>GRATIS ONGKIR</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="px-4 pb-4 pt-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-[13px] mb-0.5 leading-tight line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-[#8E8E93] mb-1 line-clamp-1">
                            {product.category?.name || 'Premium'}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-[#8E8E93]">Terjual {product.totalSold}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px]">
                              {formatPrice(product.latestPrice?.selling_price || 0)}
                            </span>
                            <motion.button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={product.availableStock <= 0 && !items.some(item => item.productId === product.id)}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed relative group",
                                items.some(item => item.productId === product.id)
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : "bg-black hover:bg-[#2E2E2E] text-white disabled:bg-gray-300"
                              )}
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <AnimatePresence mode="wait">
                                {items.some(item => item.productId === product.id) ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="plus"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <FloatingNav />

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <Link to="/buyer/cart">
            <motion.div
              className="fixed z-40"
              style={{
                bottom: 'max(88px, calc(88px + env(safe-area-inset-bottom)))',
                right: '16px'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <button className="w-14 h-14 sm:w-16 sm:h-16 bg-[#111111] text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.2)] transition-all active:scale-90 hover:bg-[#2E2E2E] relative group">
                <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                <span className="absolute -top-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 bg-[#D4AF37] text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  {cartItemCount}
                </span>
                {/* Pulse animation */}
                <span className="absolute inset-0 rounded-full bg-[#111111] animate-ping opacity-20"></span>
              </button>
            </motion.div>
          </Link>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
