import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check, Package, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  categoryName?: string;
  rating?: number;
  totalSold?: number;
}

export function ProductCard({ id, name, price, imageUrl, stock, categoryName, rating = 4.5, totalSold = 0 }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const cartItem = items.find(item => item.productId === id);
  const isOutOfStock = stock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (isOutOfStock || isAdding) return;
    
    setIsAdding(true);
    addItem({
      productId: id,
      name,
      price,
      imageUrl,
      stock,
    });
    
    toast({
      title: "Ditambahkan ke keranjang",
      description: name,
      duration: 2000,
    });
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const showPlaceholder = !imageUrl || imageError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg",
        isOutOfStock && "opacity-60"
      )}>
      <div className="aspect-square relative bg-muted overflow-hidden">
        {showPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-12 h-12 text-muted-foreground/50" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground bg-background/90 px-3 py-1.5 rounded-full">
              Stok Habis
            </span>
          </div>
        )}
        {categoryName && !isOutOfStock && (
          <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-1 rounded-full font-medium shadow-sm">
            {categoryName}
          </span>
        )}
        {cartItem && !isOutOfStock && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md">
            {cartItem.quantity}
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-xs text-foreground line-clamp-2 min-h-[2.5rem] leading-tight">
          {name}
        </h3>
        
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-medium text-foreground">{rating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">Terjual {totalSold}</span>
        </div>
        
        <p className="text-primary font-bold mt-1.5 text-sm">{formatPrice(price)}</p>
        <div className="flex items-center justify-between mt-1">
          <p className={cn(
            "text-xs",
            stock <= 5 && stock > 0 ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            {stock <= 5 && stock > 0 ? `Sisa ${stock}` : `Stok: ${stock}`}
          </p>
        </div>
        
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {cartItem ? (
              <motion.div 
                key="quantity-controls"
                className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-background"
                    onClick={() => updateQuantity(id, cartItem.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.span 
                  className="font-semibold text-xs min-w-[2rem] text-center"
                  key={cartItem.quantity}
                  initial={{ scale: 1.3, color: "#D4AF37" }}
                  animate={{ scale: 1, color: "inherit" }}
                  transition={{ duration: 0.2 }}
                >
                  {cartItem.quantity}
                </motion.span>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-background"
                    onClick={() => updateQuantity(id, cartItem.quantity + 1)}
                    disabled={cartItem.quantity >= stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="add-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className={cn(
                    "w-full gap-2 transition-all",
                    isAdding && "bg-primary/80"
                  )}
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                >
                  <AnimatePresence mode="wait">
                    {isAdding ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Ditambahkan
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cart"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Tambah
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
