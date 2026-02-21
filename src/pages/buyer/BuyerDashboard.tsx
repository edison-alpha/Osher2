import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,

  Search,
  User,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Compass,
  UserCircle,
  Flame,
  Package,
  ShoppingCart,
  X,
  Copy,
  Check,
  Share2,
  Truck,
  Clock,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { NotificationDropdown } from '@/components/buyer/NotificationDropdown';
import { FloatingNav } from '@/components/buyer/FloatingNav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import images
import kretekImg from '@/assets/kretek.png';
import mildImg from '@/assets/mild.png';
import mentolImg from '@/assets/mentol.png';
import rokokImg from '@/assets/rokok.png';
import atkImg from '@/assets/ATK.png';
import foodImg from '@/assets/food.png';
import rumahTanggaImg from '@/assets/kebutuhanrumahtangga.png';

// Import banner assets
import bannerImage from '@/assets/growbanner.png';
import banner11 from '@/assets/banner11.svg';
import belanjaPng from '@/assets/belanja.png';
import vaniliVideo from '@/assets/moya-kristal.mp4';
import banner1 from '@/assets/1.webp';
import banner2 from '@/assets/2.webp';
import banner3 from '@/assets/3.webp';
import banner4 from '@/assets/4.webp';

// Import SVG icons
import deliveryGuaranteeSvg from '@/assets/delivery_guarantee.svg';
import freeShippingSvg from '@/assets/free_shipping.svg';
import originalSvg from '@/assets/original.svg';
import osercLogo from '@/assets/oserc.svg';

// Warna background untuk product cards
const bgColors = ['bg-[#F3E5D8]', 'bg-[#DBCFB0]', 'bg-[#E9DCC9]', 'bg-[#D7BEA8]'];

const categories = [
  { id: 'populer', name: 'Populer', icon: '🔥', type: 'emoji', active: true },
  { id: 'rokok', name: 'Rokok', icon: rokokImg, type: 'image', active: false },
  { id: 'food', name: 'Food', icon: foodImg, type: 'image', active: false },
  { id: 'atk', name: 'ATK', icon: atkImg, type: 'image', active: false },
  { id: 'rumah-tangga', name: 'Kebutuhan Rumah Tangga', icon: rumahTanggaImg, type: 'image', active: false },
];

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { items, addItem, removeItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('populer');
  const [selectedLocation, setSelectedLocation] = useState('kebonsari');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReferralSlide, setCurrentReferralSlide] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const referralAutoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Fetch user profile to get referral code
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('referral_code, full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const referralCode = userProfile?.referral_code || "OSHER2024";

  // Load search history
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    setShowSearchDropdown(false);
    // Navigate to catalog with search
    navigate(`/buyer/catalog?search=${encodeURIComponent(query)}`);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setIsCopied(true);
    toast({
      title: "Kode berhasil disalin!",
      description: "Kode referral sudah disalin ke clipboard",
      duration: 2000,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kode Referral Osher',
          text: `Gunakan kode referral saya: ${referralCode} untuk mendapatkan cashback!`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyCode();
    }
  };

  const banners = [
    {
      type: 'image',
      src: bannerImage,
      title: 'Experience Osher quality',
      buttonText: 'Shop now'
    },
    {
      type: 'video',
      src: vaniliVideo,
      title: 'Moya Kristal - Kesegaran yang Jernih',
      buttonText: 'Belanja sekarang'
    }
  ];

  const referralBanners = [
    { src: banner1, alt: 'Banner 1' },
    { src: banner2, alt: 'Banner 2' },
    { src: banner3, alt: 'Banner 3' },
    { src: banner4, alt: 'Banner 4' }
  ];

  // Function to scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: index * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  // Function to scroll referral banner
  const nextReferralSlide = () => {
    setCurrentReferralSlide((prev) => (prev + 1) % referralBanners.length);
  };

  // Auto slide function
  const startAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    autoScrollRef.current = setInterval(() => {
      if (!isDraggingRef.current && sliderRef.current) {
        const nextSlide = (currentSlide + 1) % banners.length;
        scrollToSlide(nextSlide);
      }
    }, 5000);
  };

  // Auto slide for referral banners
  const startReferralAutoScroll = () => {
    if (referralAutoScrollRef.current) {
      clearInterval(referralAutoScrollRef.current);
    }
    referralAutoScrollRef.current = setInterval(() => {
      nextReferralSlide();
    }, 4000);
  };

  // Start auto scroll on mount and when slide changes
  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [currentSlide]);

  // Start referral auto scroll
  useEffect(() => {
    startReferralAutoScroll();
    return () => {
      if (referralAutoScrollRef.current) {
        clearInterval(referralAutoScrollRef.current);
      }
    };
  }, [currentReferralSlide]);

  // Handle scroll events to update current slide
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      const scrollLeft = slider.scrollLeft;
      const width = slider.offsetWidth;
      const newSlide = Math.round(scrollLeft / width);
      if (newSlide !== currentSlide && !isDraggingRef.current) {
        setCurrentSlide(newSlide);
      }
    };

    slider.addEventListener('scroll', handleScroll, { passive: true });
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [currentSlide]);

  // Control video playback based on current slide
  useEffect(() => {
    const videos = document.querySelectorAll('video[data-slide]');
    videos.forEach((video) => {
      const slideIndex = parseInt(video.getAttribute('data-slide') || '0');
      if (slideIndex === currentSlide) {
        (video as HTMLVideoElement).play().catch(() => { });
      } else {
        (video as HTMLVideoElement).pause();
      }
    });
  }, [currentSlide]);

  // Fetch products from database
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_prices(selling_price, effective_date),
          inventory(quantity)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;

      // Transform data to include latest price and stock
      return data?.map(product => {
        const latestPrice = product.product_prices?.[0]?.selling_price || 0;
        const stock = product.inventory?.quantity || 0;
        return {
          ...product,
          price: latestPrice,
          stock: stock
        };
      }) || [];
    },
  });

  // Get search suggestions based on products (after products query)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !products) return [];
    const query = searchQuery.toLowerCase();

    // Get unique product names that match
    const productMatches = products
      .filter(p => p.name.toLowerCase().includes(query))
      .map(p => p.name)
      .slice(0, 5);

    return [...new Set(productMatches)];
  }, [searchQuery, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: any) => {
    // Check if product is already in cart
    const isInCart = items.some(item => item.productId === product.id);

    if (isInCart) {
      // Remove from cart
      removeItem(product.id);
      toast({
        title: "Dihapus dari Keranjang",
        description: `${product.name} telah dihapus`,
        duration: 2000,
      });
      return;
    }

    // Add to cart
    if (product.stock <= 0) {
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
      price: product.price,
      imageUrl: product.image_url,
      stock: product.stock,
    });

    toast({
      title: "Ditambahkan ke Keranjang!",
      description: `${product.name} berhasil ditambahkan`,
      duration: 2000,
    });
  };

  // Assign background colors to products
  const productsWithBg = products?.map((product, index) => {
    // Generate dummy data berdasarkan product id untuk konsistensi
    const dummySold = (parseInt(product.id.slice(-3), 16) % 500) + 10; // Terjual 10 - 510

    return {
      ...product,
      bgColor: bgColors[index % bgColors.length],
      totalSold: dummySold
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-24">
      <div className="max-w-md mx-auto px-4" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/buyer/profile">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <img
                  src={osercLogo}
                  alt="Profile"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>

            {/* Search Bar */}
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" strokeWidth={1.5} />
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
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearchSelect(searchQuery);
                  }
                }}
                className="w-full bg-white border-none rounded-full py-2.5 pl-11 pr-4 focus-visible:ring-1 focus-visible:ring-black/5 placeholder-gray-400 text-sm shadow-sm h-11"
              />

              {/* Search Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && (searchQuery || searchHistory.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                    style={{
                      left: '-48px',
                      right: '-96px',
                      width: 'auto'
                    }}
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

            <div className="flex gap-2 shrink-0">
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="mb-6 pl-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-[22px] font-bold leading-[1.1] tracking-tight text-[#111111]">
                Nikmati kemudahan<br />belanja setiap hari
              </h1>
              <p className="text-[13px] text-[#8E8E93] mt-2 leading-relaxed">
                Produk berkualitas, harga terjangkau, pengiriman cepat
              </p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[140px] h-9 border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-black" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kebonsari" className="focus:bg-black focus:text-white">Kebonsari</SelectItem>
                  <SelectItem value="geger" className="focus:bg-black focus:text-white">Geger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Hero Banner Slider */}
        <div className="relative mb-6 -mx-4 px-2">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              startXRef.current = e.pageX - (sliderRef.current?.offsetLeft || 0);
              scrollLeftRef.current = sliderRef.current?.scrollLeft || 0;
              if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
              }
            }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current) return;
              e.preventDefault();
              const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
              const walk = (x - startXRef.current) * 2;
              if (sliderRef.current) {
                sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
              }
            }}
            onMouseUp={() => {
              isDraggingRef.current = false;
              startAutoScroll();
            }}
            onMouseLeave={() => {
              if (isDraggingRef.current) {
                isDraggingRef.current = false;
                startAutoScroll();
              }
            }}
            onTouchStart={() => {
              isDraggingRef.current = true;
              if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
              }
            }}
            onTouchEnd={() => {
              isDraggingRef.current = false;
              startAutoScroll();
            }}
          >
            {banners.map((banner, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 snap-center"
              >
                <div className="relative bg-gradient-to-br from-[#EFEFEF] to-white rounded-[2.5rem] overflow-hidden h-48 flex items-center border border-white mx-0.5">
                  {/* Background Media */}
                  <div className="absolute inset-0 z-0">
                    {banner.type === 'image' ? (
                      <img
                        src={banner.src}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                        data-slide={index}
                      >
                        <source src={banner.src} type="video/mp4" />
                      </video>
                    )}
                  </div>

                  <div className="z-10 max-w-[55%] relative p-8">
                    <h2 className={cn(
                      "text-lg font-bold mb-4 leading-tight drop-shadow-lg",
                      index === 0 ? "text-white" : "text-[#111111]"
                    )}>
                      {banner.title}
                    </h2>
                    <Link to="/buyer/catalog">
                      <button className="bg-white text-[#111111] px-5 py-2.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md">
                        {banner.buttonText}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentSlide === index ? "w-6 bg-[#111111]" : "w-2 bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-6 overflow-hidden">
          <div className="flex items-center gap-12 animate-scroll">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={deliveryGuaranteeSvg} alt="Delivery Guarantee" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Pengiriman Terjamin</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={freeShippingSvg} alt="Gratis Ongkir" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Gratis Ongkir</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={originalSvg} alt="Original" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Produk Original</span>
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={deliveryGuaranteeSvg} alt="Delivery Guarantee" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Pengiriman Terjamin</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={freeShippingSvg} alt="Gratis Ongkir" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Gratis Ongkir</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src={originalSvg} alt="Original" className="w-8 h-8" />
              <span className="text-[9px] text-[#8E8E93]">Produk Original</span>
            </div>
          </div>
        </div>

        {/* Referral & Commission Section */}
        <div className="mb-6 -mx-4">
          <div className="bg-gradient-to-br from-[#EFEFEF] to-white py-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-4">
                <h3 className="text-[14px] font-bold text-[#111111]">
                  Kode Referal Anda: <span className="text-[#D4AF37]">{referralCode}</span>
                </h3>
                <Link to="/buyer/profile">
                  <button className="text-[#111111] text-[10px] font-semibold flex items-center gap-1">
                    Lihat Saldo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>

              {/* Content - Full Width Banner with Animation */}
              <div className="px-4 relative">
                <div className="relative rounded-2xl min-h-[200px]">
                  {/* Banner dengan Fade Transition */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentReferralSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="relative"
                    >
                      <motion.img
                        src={referralBanners[currentReferralSlide].src}
                        alt={referralBanners[currentReferralSlide].alt}
                        className="w-full h-auto object-cover rounded-2xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Button Daftar Sekarang - only on first banner */}
                      {currentReferralSlide === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="absolute bottom-14 left-6"
                        >
                          <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="bg-black text-white px-3 py-0.5 rounded-full text-[10px] font-bold transition-all active:scale-95 shadow-lg hover:shadow-xl"
                          >
                            Daftar Sekarang
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {referralBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentReferralSlide(index)}
                        className={cn(
                          "transition-all duration-300 rounded-full",
                          currentReferralSlide === index
                            ? "w-6 h-1.5 bg-white"
                            : "w-1.5 h-1.5 bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[#111111]">Kategori</h2>
            <Link to="/buyer/catalog">
              <button className="flex items-center gap-1 text-[#111111] text-[10px] font-semibold">
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {categories.map((cat) => (
              <Link key={cat.id} to="/buyer/catalog">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
                    {cat.type === 'image' ? (
                      <img
                        src={cat.icon}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[28px]">{cat.icon}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-[#111111] text-center tracking-wide w-20 line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Products Grid - Produk Populer */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#111111]">Produk Populer</h2>
            <Link to="/buyer/catalog">
              <button className="flex items-center gap-1 text-[#111111] text-[10px] font-semibold">
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-x-2 gap-y-4 -mx-4 px-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-slate-200 animate-pulse rounded-[2rem] p-4 mb-3 relative aspect-[4/5]"></div>
                <div className="px-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </motion.div>
            ))
          ) : productsWithBg.length > 0 ? (
            productsWithBg.slice(0, 4).map((product, index) => (
              <motion.div
                key={product.id}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -5 }}
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
                            {product.categories?.name || 'Premium'}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-[#8E8E93]">Terjual {product.totalSold}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px]">
                              {formatPrice(product.price)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={product.stock <= 0 && !items.some(item => item.productId === product.id)}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed relative group",
                                items.some(item => item.productId === product.id)
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : "bg-black hover:bg-[#2E2E2E] text-white disabled:bg-gray-300"
                              )}
                            >
                              {items.some(item => item.productId === product.id) ? (
                                <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                              ) : (
                                <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-slate-500">
              Tidak ada produk tersedia
            </div>
          )}
        </motion.div>

        {/* Products Grid - Produk Terlaris */}
        <div className="mb-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#111111]">Produk Terlaris</h2>
            <Link to="/buyer/catalog">
              <button className="flex items-center gap-1 text-[#111111] text-[10px] font-semibold">
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-4 -mx-4 px-2">
          {isLoading ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="group">
                <div className="bg-slate-200 animate-pulse rounded-[2rem] p-4 mb-3 relative aspect-[4/5]"></div>
                <div className="px-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : productsWithBg.length > 0 ? (
            [...productsWithBg]
              .sort((a, b) => b.totalSold - a.totalSold)
              .slice(0, 4)
              .map((product) => (
                <motion.div
                  key={product.id}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -5 }}
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

                        {/* Badge - Best Seller */}
                        <div className="absolute bottom-0 left-0">
                          <div className="bg-[#D4AF37] text-white text-[8px] font-bold py-1.5 px-3 flex items-center gap-1 rounded-tr-lg">
                            <Flame className="w-3 h-3 fill-white" strokeWidth={2.5} />
                            <span>TERLARIS</span>
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
                              {product.categories?.name || 'Premium'}
                            </p>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-[#D4AF37] font-semibold">Terjual {product.totalSold}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[14px]">
                                {formatPrice(product.price)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                disabled={product.stock <= 0 && !items.some(item => item.productId === product.id)}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed relative group",
                                  items.some(item => item.productId === product.id)
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-black hover:bg-[#2E2E2E] text-white disabled:bg-gray-300"
                                )}
                              >
                                {items.some(item => item.productId === product.id) ? (
                                  <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                                ) : (
                                  <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
          ) : (
            <div className="col-span-2 text-center py-8 text-slate-500">
              Tidak ada produk tersedia
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Using FloatingNav Component */}
      <FloatingNav />

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl bg-white/95 backdrop-blur-xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-[#111111]">
              Bagikan Kode Referral
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-6">
              <p className="text-sm text-[#8E8E93] mb-4">
                Ajak teman belanja dan dapatkan NETN dari setiap pembelian mereka!
              </p>

              {/* Referral Code Display */}
              <div className="bg-[#111111] rounded-2xl p-6 mb-4 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                {/* Success Animation Overlay */}
                {isCopied && (
                  <div className="absolute inset-0 bg-green-500 flex items-center justify-center z-20 animate-fade-in-out">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center animate-scale-in">
                        <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
                      </div>
                      <p className="text-white font-bold text-lg">Berhasil Disalin!</p>
                    </div>
                  </div>
                )}

                <div className="relative z-10">
                  <p className="text-xs text-white/60 mb-2">Kode Referral Anda:</p>
                  <p className="text-3xl font-bold text-white tracking-wider mb-4">
                    {referralCode}
                  </p>
                  <p className="text-xs text-white/60">
                    Dapatkan cashback setiap pembelian
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCopyCode}
                className="w-full bg-[#111111] text-white py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#2c2c2c]"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Berhasil Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Kode
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="w-full bg-white border-2 border-[#111111] text-[#111111] py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#F9F9F9]"
              >
                <Share2 className="w-4 h-4" />
                Bagikan ke Teman
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes scaleIn {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
