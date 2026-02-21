import { useEffect, useState } from 'react';
import { X, Package, CreditCard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingNotificationProps {
  id: string;
  type: 'new_order' | 'new_payment';
  title: string;
  message: string;
  orderNumber: string;
  buyerName?: string;
  buyerImage?: string;
  productImage?: string;
  onClose: (id: string) => void;
  onClick: () => void;
  duration?: number;
}

export function FloatingNotification({
  id,
  type,
  title,
  message,
  orderNumber,
  buyerName,
  buyerImage,
  productImage,
  onClose,
  onClick,
  duration = 10000,
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.92 }}
          transition={{ 
            type: 'spring', 
            stiffness: 380, 
            damping: 28,
            mass: 0.6
          }}
          onClick={onClick}
          className="relative overflow-hidden rounded-[22px] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform max-w-md w-full"
          style={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Pure Glassmorphism Background - iOS Style */}
          <div 
            className="absolute inset-0 bg-white/75 backdrop-blur-[40px] backdrop-saturate-[180%]"
            style={{
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
          />
          
          {/* Subtle border */}
          <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-black/[0.08]" />

          {/* Content */}
          <div className="relative p-4">
            <div className="flex gap-3.5">
              {/* Left side - Avatar/Image */}
              <div className="flex-shrink-0">
                {buyerImage || productImage ? (
                  <div className="relative">
                    <img
                      src={buyerImage || productImage}
                      alt={buyerName || 'Product'}
                      className="w-14 h-14 rounded-[14px] object-cover ring-1 ring-black/[0.08] shadow-sm"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className={`hidden w-14 h-14 rounded-[14px] flex items-center justify-center shadow-sm ring-1 ring-black/[0.08] ${
                      type === 'new_order'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}>
                      {type === 'new_order' ? (
                        <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
                      ) : (
                        <CreditCard className="w-6 h-6 text-white" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center shadow-sm ring-1 ring-black/[0.08] ${
                    type === 'new_order'
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                  }`}>
                    {type === 'new_order' ? (
                      <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
                    ) : (
                      <CreditCard className="w-6 h-6 text-white" strokeWidth={2.5} />
                    )}
                  </div>
                )}
              </div>

              {/* Right side - Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight mb-0.5">
                      {type === 'new_order' ? 'PESANAN BARU' : 'PEMBAYARAN BARU'}
                    </p>
                    <p className="text-[15px] font-semibold text-gray-900 leading-tight">
                      {title}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-black/[0.06] hover:bg-black/[0.1] active:bg-black/[0.15] flex items-center justify-center transition-colors"
                  >
                    <X className="w-[15px] h-[15px] text-gray-700" strokeWidth={2.5} />
                  </button>
                </div>
                
                {buyerName && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <User className="w-3 h-3 text-gray-500" strokeWidth={2.5} />
                    <p className="text-[13px] font-medium text-gray-600">
                      {buyerName}
                    </p>
                  </div>
                )}
                
                <p className="text-[13px] text-gray-600 leading-snug line-clamp-2 font-normal mb-2">
                  {message}
                </p>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    type === 'new_order'
                      ? 'bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/20'
                      : 'bg-green-500/10 text-green-700 ring-1 ring-inset ring-green-500/20'
                  }`}>
                    {orderNumber}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">sekarang</span>
                </div>
              </div>
            </div>

            {/* Progress bar - iOS style */}
            <div className="mt-3 h-1 bg-black/[0.06] rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  type === 'new_order' 
                    ? 'bg-blue-500' 
                    : 'bg-green-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
