import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Heart,
  Search,
  User,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Compass,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Kategori rokok
const categories = [
  { 
    name: 'Full Flavor', 
    image: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=200&h=200&fit=crop&q=80'
  },
  { 
    name: 'Menthol', 
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=200&h=200&fit=crop&q=80'
  },
  { 
    name: 'Ringan', 
    image: 'https://cdn.pixabay.com/photo/2016/03/27/19/43/cigarette-1283989_1280.jpg'
  },
  { 
    name: 'Cerutu', 
    image: 'https://images.pexels.com/photos/1598213/pexels-photo-1598213.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
  },
  { 
    name: 'Aksesori', 
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&q=80'
  },
];

// Data produk rokok
const cigaretteProducts = [
  {
    id: '1',
    name: 'Dji Sam Soe 234',
    category: 'SKT',
    price: 35000,
    rating: 4.9,
    sold: 1250,
    image: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&h=500&fit=crop&q=80',
    unit: 'pack'
  },
  {
    id: '2',
    name: 'Sampoerna A Mild',
    category: 'SKM Mild',
    price: 28000,
    rating: 4.8,
    sold: 2340,
    image: 'https://cdn.pixabay.com/photo/2016/03/27/19/43/cigarette-1283989_1280.jpg',
    unit: 'pack'
  },
  {
    id: '3',
    name: 'Gudang Garam Surya',
    category: 'SKM',
    price: 32000,
    rating: 4.7,
    sold: 890,
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop&q=80',
    unit: 'pack'
  },
  {
    id: '4',
    name: 'Marlboro Red',
    category: 'SPM',
    price: 38000,
    rating: 4.6,
    sold: 1560,
    image: 'https://images.pexels.com/photos/1598213/pexels-photo-1598213.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
    unit: 'pack'
  },
];

export default function BuyerDashboard() {
  const { items } = useCart();
  const [activeTab, setActiveTab] = useState('new-arrivals');
  const [searchQuery, setSearchQuery] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { id: 'new-arrivals', label: 'Terbaru' },
    { id: 'cigarettes', label: 'Rokok' },
    { id: 'hand-rolled', label: 'Kretek' },
    { id: 'pipes', label: 'Cerutu' },
    { id: 'lighters', label: 'Korek' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="px-5 py-4 space-y-4 bg-white dark:bg-slate-950 sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <Link to="/buyer/profile">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white overflow-hidden border-2 border-white shadow-md">
              <User className="h-6 w-6" />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/buyer/cart" className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <ShoppingBag className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </Link>
            <button className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="h-5 w-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <div className="flex-1 relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-1.5">
            <svg 
              className="w-3.5 h-3.5 text-amber-600 mr-1.5 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
              />
            </svg>
            <Input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 h-auto"
            />
            <button className="w-7 h-7 bg-amber-600 hover:bg-amber-700 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0 ml-1.5">
              <Search className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-sm font-medium whitespace-nowrap pb-1 transition-colors",
                activeTab === tab.id
                  ? "font-bold border-b-2 border-amber-600 text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="space-y-8 mt-4">
        {/* Hero Banner */}
        <section className="px-3">
          <div className="relative h-[200px] rounded-[16px] overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-7 flex flex-col justify-center">
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-amber-600">
                Edisi Spesial
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Koleksi Tembakau<br />Premium
              </h2>
              <p className="text-[10px] text-slate-300 mt-1 max-w-[160px]">
                Rasakan kekayaan rasa dari campuran artisan yang dikurasi untuk para penggemar sejati.
              </p>
              <Link to="/buyer/catalog">
                <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-md text-[11px] font-bold tracking-wider uppercase transition-transform active:scale-95">
                  Jelajahi Koleksi
                </Button>
              </Link>
            </div>
            <div className="absolute right-[-10%] bottom-0 top-0 w-3/5 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&h=400&fit=crop&q=80" 
                alt="Premium Cigarette"
                className="h-[85%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] rotate-[-12deg]"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base tracking-tight uppercase">Kategori</h3>
            <Link to="/buyer/catalog" className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 uppercase tracking-wider">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 scrollbar-hide">
            {categories.map((category) => (
              <div key={category.name} className="flex flex-col items-center gap-3 min-w-[72px]">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase text-center">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Bestsellers */}
        <section className="px-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base tracking-tight uppercase">Terlaris</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-3">
            {cigaretteProducts.map((product: any) => (
              <Card key={product.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden group">
                <div className="relative aspect-[4/3] bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  <button className="absolute top-2 right-2 w-7 h-7 bg-white/80 dark:bg-slate-700/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm z-10">
                    <Heart className="w-[18px] h-[18px] text-slate-400" />
                  </button>
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 group-hover:scale-105 transition-transform"></div>
                  )}
                </div>
                <div className="p-2.5 space-y-0.5">
                  <div className="-mx-2.5 -mt-2.5 mb-1">
                    <span className="inline-block bg-amber-600 text-white text-[9px] font-bold uppercase tracking-tighter px-2.5 py-1 rounded-r-full">
                      {product.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight line-clamp-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-0.5 text-amber-600">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-[10px] h-[10px]", i < Math.floor(product.rating) ? "fill-current" : "")} />
                    ))}
                    <span className="text-[9px] font-medium ml-1 text-slate-400">
                      {product.rating}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 pt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                      <span className="text-[9px] text-slate-400">/ {product.unit}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">
                      {product.sold} terjual
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 z-50">
        <div className="max-w-[430px] mx-auto flex justify-around items-center py-3 px-6">
          <Link to="/buyer" className="flex flex-col items-center gap-1 text-slate-900 dark:text-amber-600">
            <ShoppingBag className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Beranda</span>
          </Link>
          <Link to="/buyer/catalog" className="flex flex-col items-center gap-1 text-slate-400">
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Katalog</span>
          </Link>
          <Link to="/buyer/orders" className="flex flex-col items-center gap-1 text-slate-400">
            <Star className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Pesanan</span>
          </Link>
          <button className="flex flex-col items-center gap-1 text-slate-400">
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Favorit</span>
          </button>
          <Link to="/buyer/profile" className="flex flex-col items-center gap-1 text-slate-400">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-widest">Lainnya</span>
          </Link>
        </div>
        <div className="h-1 w-32 bg-slate-900/10 dark:bg-white/10 rounded-full mx-auto mb-1.5"></div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
