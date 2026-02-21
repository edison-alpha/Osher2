import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import osercLogo from '@/assets/oserc.svg';

const navItems = [
  { path: '/buyer', icon: Home, label: 'Home' },
  { path: '/buyer/catalog', icon: ShoppingBag, label: 'Katalog' },
  { path: '/buyer/cart', icon: ShoppingCart, label: 'Keranjang', showBadge: true },
  { path: '/buyer/orders', icon: ClipboardList, label: 'Pesanan' },
  { path: '/buyer/profile', icon: null, label: 'Profil', isAvatar: true },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label, showBadge, isAvatar }) => {
          const isActive = location.pathname === path || 
            (path !== '/buyer' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full relative transition-all duration-200",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              <div className="relative">
                {isAvatar ? (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200",
                    isActive ? "bg-white ring-2 ring-white/30" : "bg-white/10 ring-1 ring-white/20"
                  )}>
                    <img 
                      src={osercLogo} 
                      alt="Profile"
                      className={cn(
                        "object-contain transition-all duration-200",
                        isActive ? "w-5 h-5" : "w-4 h-4 opacity-70"
                      )}
                    />
                  </div>
                ) : Icon ? (
                  <>
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive && "scale-110"
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    {showBadge && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium transition-all duration-200",
                isActive ? "text-white" : "text-white/50"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
