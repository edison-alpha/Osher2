import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Minus, Plus, Package, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items.map(item => item.productId)));
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch buyer profile data
  const { data: buyerProfile } = useQuery({
    queryKey: ['buyer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select(`
          *,
          domiciles(
            city,
            province
          )
        `)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch system settings for shipping cost
  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['shipping_cost_default', 'free_shipping_threshold']);
      
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      return settings;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate subtotal for selected items only
  const selectedSubtotal = items
    .filter(item => selectedItems.has(item.productId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate shipping cost
  const shippingCost = systemSettings?.shipping_cost_default 
    ? parseFloat(systemSettings.shipping_cost_default) 
    : 15000;
  
  const freeShippingThreshold = systemSettings?.free_shipping_threshold
    ? parseFloat(systemSettings.free_shipping_threshold)
    : 100000;

  // Check if eligible for free shipping (based on selected items)
  const shipping = selectedSubtotal >= freeShippingThreshold ? 0 : shippingCost;

  // Calculate discount (based on selected items)
  const discountAmount = appliedDiscount > 0 
    ? (selectedSubtotal * appliedDiscount) / 100 
    : 0;

  // Calculate total (based on selected items)
  const total = selectedSubtotal - discountAmount + shipping;

  // Handle apply discount code
  const handleApplyDiscount = () => {
    if (discountCode.trim().toUpperCase() === 'OSHER10') {
      setAppliedDiscount(10);
    } else if (discountCode.trim().toUpperCase() === 'OSHER20') {
      setAppliedDiscount(20);
    } else if (discountCode.trim()) {
      alert('Kode diskon tidak valid');
    }
  };

  // Handle select/deselect item
  const toggleSelectItem = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.productId)));
    }
  };

  // Handle delete selected items
  const handleDeleteSelected = () => {
    selectedItems.forEach(productId => {
      removeItem(productId);
    });
    setSelectedItems(new Set());
    setShowDeleteDialog(false);
  };

  // Handle clear cart
  const handleClearCart = () => {
    clearCart();
    setSelectedItems(new Set());
    setShowClearDialog(false);
  };

  if (items.length === 0) {
    return (
      <motion.div 
        className="min-h-screen bg-[#F9FAFB] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <button 
            onClick={() => navigate('/buyer')} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[#111111]">Keranjang</h1>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </header>
        
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Package className="w-12 h-12 text-gray-400" />
          </motion.div>
          <h2 className="text-lg font-bold text-[#111111] mb-2">Keranjang Kosong</h2>
          <p className="text-gray-500 text-center mb-6 max-w-xs text-xs">
            Belum ada produk di keranjang Anda. Yuk mulai belanja!
          </p>
          <Link to="/buyer/catalog">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-[#111111] text-white hover:bg-[#2E2E2E] px-8 py-3 rounded-2xl font-semibold">
                Mulai Belanja
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '16px' }}>
        <button 
          onClick={() => navigate('/buyer')} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111]">Keranjang</h1>
        <button 
          onClick={() => setShowClearDialog(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Select All Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedItems.size === items.length && items.length > 0}
            onCheckedChange={toggleSelectAll}
            className="border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Pilih Semua ({selectedItems.size}/{items.length})
          </span>
        </div>
        {selectedItems.size > 0 && (
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="text-sm text-red-600 font-medium hover:text-red-700 transition-colors"
          >
            Hapus ({selectedItems.size})
          </button>
        )}
      </div>

      {/* Main Content */}
      <motion.div 
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar pb-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cart Items */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div 
              key={item.productId} 
              className="flex gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              layout
            >
            {/* Checkbox */}
            <div className="flex items-start pt-2">
              <Checkbox
                checked={selectedItems.has(item.productId)}
                onCheckedChange={() => toggleSelectItem(item.productId)}
                className="border-gray-300"
              />
            </div>

            {/* Product Image */}
            <div className="w-24 h-24 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  src={item.imageUrl}
                />
              ) : (
                <Package className="w-10 h-10 text-gray-400" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between flex-1 py-1">
              <div>
                <h3 className="font-semibold text-xs text-[#111111] leading-tight line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">Kualitas Premium</p>
                <p className="text-[9px] font-medium text-gray-400 mt-1">
                  Stok: {item.stock}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-[#111111]">
                  {formatPrice(item.price)}
                </span>

                {/* Quantity Controls */}
                <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 gap-2">
                  <motion.button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-5 h-5 flex items-center justify-center text-gray-600"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <motion.span 
                    className="text-xs font-semibold w-4 text-center"
                    key={item.quantity}
                    initial={{ scale: 1.3, color: "#D4AF37" }}
                    animate={{ scale: 1, color: "#111111" }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.quantity}
                  </motion.span>
                  <motion.button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 disabled:opacity-50"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>

        {/* Discount Code - Hidden for future use */}
        <div className="hidden">
          <div className="flex gap-2">
            <Input
              className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-[#111111] outline-none placeholder:text-gray-400"
              placeholder="Masukkan kode diskon"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
            />
            <Button 
              onClick={handleApplyDiscount}
              className="bg-[#111111] text-white px-6 rounded-2xl font-semibold text-sm transition-opacity active:opacity-80"
            >
              Terapkan
            </Button>
          </div>
          {appliedDiscount > 0 && (
            <p className="text-xs text-green-600 mt-2 ml-1">
              ✓ Kode diskon berhasil diterapkan!
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Sub-total ({selectedItems.size} item):</span>
            <span className="font-semibold text-xs text-[#111111]">{formatPrice(selectedSubtotal)}</span>
          </div>
          {/* Discount Amount - Hidden for future use */}
          {discountAmount > 0 && false && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs">Discount ({appliedDiscount}%):</span>
              <span className="font-semibold text-green-600">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Ongkir:</span>
            {shipping === 0 ? (
              <span className="font-semibold text-green-600">GRATIS</span>
            ) : (
              <span className="font-semibold text-xs text-[#111111]">{formatPrice(shipping)}</span>
            )}
          </div>
          {/* Commission Info */}
          <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-xl">
            <span className="text-green-700 text-xs font-medium flex items-center gap-1">
              🎁 NETN Anda:
            </span>
            <span className="font-bold text-xs text-green-700">
              +{formatPrice(selectedSubtotal * 0.05)}
            </span>
          </div>
          {selectedSubtotal < freeShippingThreshold && shipping > 0 && (
            <p className="text-[10px] text-gray-500">
              Belanja {formatPrice(freeShippingThreshold - selectedSubtotal)} lagi untuk gratis ongkir!
            </p>
          )}
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-[#111111]">Total:</span>
            <motion.span 
              className="text-base font-bold text-[#111111]"
              key={total}
              initial={{ scale: 1.2, color: "#D4AF37" }}
              animate={{ scale: 1, color: "#111111" }}
              transition={{ duration: 0.3 }}
            >
              {formatPrice(total)}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Fixed Bottom - Checkout Button */}
      <div 
        className="fixed left-0 right-0 max-w-md mx-auto px-6 py-3 bg-white border-t border-gray-100 shadow-lg z-50"
        style={{ 
          bottom: 'max(0px, env(safe-area-inset-bottom))',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Link to="/buyer/checkout">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full bg-[#111111] text-white rounded-full font-bold text-sm shadow-lg h-16"
              disabled={selectedItems.size === 0}
            >
              Lanjut ke Pembayaran ({selectedItems.size} item)
            </Button>
          </motion.div>
        </Link>
      </div>

      {/* Clear Cart Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-sm mx-auto rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bersihkan Keranjang?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua item di keranjang akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Bersihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm mx-auto rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItems.size} item akan dihapus dari keranjang. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
