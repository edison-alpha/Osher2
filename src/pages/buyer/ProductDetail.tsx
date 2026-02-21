import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Package, Truck, ShieldCheck, Store, Plus, Minus, ShoppingCart, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { items, addItem, updateQuantity, removeItem } = useCart();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = products?.find(p => p.id === productId);
  const cartItem = items.find(item => item.productId === productId);

  const dummySold = product ? (parseInt(product.id.slice(-3), 16) % 500) + 100 : 100;

  // Images array (untuk carousel)
  const images = product?.image_url ? [product.image_url] : [];

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
    }
  }, [cartItem]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.availableStock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.availableStock <= 0) {
      toast({
        title: "Stok Habis",
        description: "Produk ini sedang tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    if (cartItem) {
      updateQuantity(product.id, quantity);
      toast({
        title: "Keranjang Diperbarui!",
        description: `${product.name} (${quantity} item)`,
        duration: 2000,
      });
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.latestPrice?.selling_price || 0,
        imageUrl: product.image_url,
        stock: product.availableStock,
        quantity: quantity,
      });
      toast({
        title: "Ditambahkan ke Keranjang!",
        description: `${product.name} (${quantity} item)`,
        duration: 2000,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.availableStock <= 0) {
      toast({
        title: "Stok Habis",
        description: "Produk ini sedang tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    if (!cartItem) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.latestPrice?.selling_price || 0,
        imageUrl: product.image_url,
        stock: product.availableStock,
        quantity: quantity,
      });
    } else {
      updateQuantity(product.id, quantity);
    }

    navigate('/buyer/cart');
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: `Lihat ${product.name} - ${formatPrice(product.latestPrice?.selling_price || 0)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Disalin!",
        description: "Link produk telah disalin ke clipboard",
        duration: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="w-full aspect-square" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Package className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-gray-500 text-center mb-6">
          Produk yang Anda cari tidak tersedia
        </p>
        <Button onClick={() => navigate('/buyer/catalog')} className="rounded-full">
          Kembali ke Katalog
        </Button>
      </div>
    );
  }

  const price = product.latestPrice?.selling_price || 0;
  const stock = product.availableStock || 0;

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-16">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-[#F9F9F9] flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#111111]" strokeWidth={2} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-[#F9F9F9] flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#111111]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative bg-white mb-2">
        <div className="aspect-square relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex] || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentImageIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Product Info Card */}
      <div className="bg-white rounded-3xl mx-4 p-4 mb-2 shadow-sm">
        {/* Price */}
        <div className="flex items-start justify-between mb-2">
          <div className="text-[22px] font-bold text-[#111111] leading-none">
            {formatPrice(price)}
          </div>
          {product.category?.name && (
            <Badge variant="secondary" className="rounded-full text-[9px] font-semibold">
              {product.category.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-[#8E8E93] font-medium">Terjual {dummySold}</span>
        </div>

        {/* Product Name */}
        <h1 className="text-[16px] font-bold text-[#111111] mb-3 leading-tight">
          {product.name}
        </h1>

        {/* Features - Inline */}
        <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 p-2 bg-green-50 rounded-xl">
            <Truck className="w-4 h-4 text-green-600 shrink-0" strokeWidth={2} />
            <span className="text-[9px] text-green-700 font-bold leading-tight">Gratis<br />Ongkir</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-blue-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2} />
            <span className="text-[9px] text-blue-700 font-bold leading-tight">100%<br />Original</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-purple-50 rounded-xl">
            <span className="text-[11px] shrink-0">🎁</span>
            <span className="text-[9px] text-purple-700 font-bold leading-tight">Dapat<br />NETN</span>
          </div>
        </div>

        {/* Stock Info - Compact */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#111111]">Stok</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  stock > 50 ? "bg-green-500" : stock > 20 ? "bg-yellow-500" : "bg-red-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stock / 100) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#111111]">{stock}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl mx-4 p-4 mb-2 shadow-sm">
        <h2 className="text-[13px] font-bold text-[#111111] mb-2">Deskripsi</h2>
        <p className="text-[11px] text-[#8E8E93] leading-relaxed">
          {product.description || 'Produk berkualitas tinggi dengan harga terbaik. Dapatkan pengalaman berbelanja yang menyenangkan dengan layanan terpercaya.'}
        </p>
      </div>



      {/* Store Info */}
      <div className="bg-white rounded-3xl mx-4 p-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[11px] text-[#111111]">OSHER Official Store</h3>
            <p className="text-[9px] text-[#8E8E93]">Online • Jakarta</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E8E93] shrink-0" />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div className="max-w-md mx-auto px-4 pt-2">
          <div className="flex items-center gap-1.5">
            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-50 rounded-full px-1 py-0.5">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-3 h-3" strokeWidth={2.5} />
              </button>
              <span className="text-xs font-bold min-w-[24px] text-center">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= stock}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
              </button>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleAddToCart}
              disabled={stock <= 0}
              variant="outline"
              className="rounded-full h-9 px-3 font-semibold border-[#111111] text-[#111111] hover:bg-gray-50 text-[11px]"
            >
              {cartItem ? (
                <>
                  <Check className="w-3 h-3 mr-1" strokeWidth={2.5} />
                  Keranjang
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 mr-1" strokeWidth={2.5} />
                  Keranjang
                </>
              )}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={stock <= 0}
              className="flex-1 rounded-full h-9 bg-[#111111] hover:bg-black font-semibold text-[11px]"
            >
              Beli Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
