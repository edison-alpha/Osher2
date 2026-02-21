import { useLocation, useNavigate } from 'react-router-dom';
import { Home, NotepadText, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import osercLogo from '@/assets/oserc.svg';
import smileCatalog from '@/assets/smile catalog.svg';

interface NavItem {
  path: string;
  exact?: boolean;
  icon: React.ElementType;
  label: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { path: '/buyer', exact: true, icon: Home, label: 'Home' },
  { path: '/buyer/orders', icon: NotepadText, label: 'Pesanan' },
  { path: '/buyer/catalog', icon: () => null, label: 'Katalog' }, // Custom icon - di tengah
  { path: '/buyer/cart', icon: ShoppingCart, label: 'Keranjang', showBadge: true },
  { path: '/buyer/profile', icon: () => null, label: 'Profile' }, // Hidden nav item for profile
];

export function FloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Check if we're on profile page
  const isProfilePage = location.pathname === '/buyer/profile';

  const getCurrentIndex = useCallback(() => {
    return navItems.findIndex((item) => {
      if (item.exact) {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    });
  }, [location.pathname]);

  // Initial sync
  useEffect(() => {
    const idx = getCurrentIndex();
    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, []);

  const handleNavClick = (e: React.MouseEvent, item: NavItem, index: number) => {
    e.preventDefault();
    if (index === activeIndex || isAnimating) return;
    
    setIsAnimating(true);
    setActiveIndex(index);
    
    // Small delay to let animation start
    setTimeout(() => {
      navigate(item.path);
      setIsAnimating(false);
    }, 50);
  };

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 z-50 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-3xl"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#000000',
      }}
    >
      <div className="flex items-center justify-center w-full px-2 py-1 gap-0">
        <nav 
          className="flex items-center gap-0 justify-center"
        >
          {navItems.slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex && !isProfilePage;
            const isCatalog = index === 2; // Katalog sekarang di index 2 (tengah)
            
            return (
              <a 
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item, index)}
                className="cursor-pointer"
              >
                <motion.button 
                  layout
                  className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-200 rounded-2xl",
                    isCatalog 
                      ? "px-3 sm:px-4 -mt-8" // Katalog lebih ke atas
                      : "px-4 sm:px-5 py-2",
                    isActive && !isCatalog
                      ? "text-white bg-white/15"
                      : !isCatalog && "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <motion.div
                    className="relative"
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <div className="relative">
                      {isCatalog ? (
                        <img 
                          src={smileCatalog} 
                          alt="Katalog"
                          className={cn(
                            "shrink-0 transition-all duration-200",
                            isActive ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
                          )}
                        />
                      ) : (
                        <Icon 
                          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                          strokeWidth={isActive ? 2 : 1.5}
                        />
                      )}
                      {/* Badge untuk keranjang */}
                      {item.showBadge && totalItems > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-lg"
                        >
                          {totalItems > 9 ? '9+' : totalItems}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Label selalu tampil */}
                  <motion.span 
                    className={cn(
                      "text-[9px] sm:text-[10px] font-medium tracking-tight whitespace-nowrap mt-1",
                      isCatalog 
                        ? (isActive ? "text-white" : "text-white/70")
                        : (isActive ? "text-white" : "text-white/50")
                    )}
                    animate={{
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              </a>
            );
          })}
        </nav>
        
        {/* Profile Button - Lebih besar */}
        <a href="/buyer/profile" className="flex-shrink-0">
          <motion.button 
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200 py-2 px-4 sm:px-5 rounded-2xl",
              isProfilePage 
                ? "text-white bg-white/15" 
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              animate={{
                scale: isProfilePage ? 1.1 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              <img 
                src={osercLogo} 
                alt="Profile"
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] object-contain transition-all duration-200"
              />
            </motion.div>
            <span 
              className={cn(
                "text-[9px] sm:text-[10px] font-medium tracking-tight whitespace-nowrap mt-1",
                isProfilePage ? "text-white" : "text-white/50"
              )}
            >
              Profile
            </span>
          </motion.button>
        </a>
      </div>
    </div>
  );
}
