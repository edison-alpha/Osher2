import { useLocation, useNavigate } from 'react-router-dom';
import { Package, ClipboardList, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface NavItem {
  path: string;
  exact?: boolean;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/courier', exact: true, icon: Package, label: 'Dashboard' },
  { path: '/courier/active', icon: ClipboardList, label: 'Aktif' },
  { path: '/courier/history', icon: History, label: 'Riwayat' },
  { path: '/courier/profile', icon: User, label: 'Profil' },
];

export function CourierFloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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
      className="fixed left-0 right-0 bottom-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-3xl"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-center w-full px-2 py-1 gap-0">
        <nav 
          className="flex items-center gap-0 justify-center"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            
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
                    "relative flex flex-col items-center justify-center transition-all duration-200 px-4 sm:px-5 rounded-2xl",
                    isActive
                      ? "text-white py-2 bg-white/15"
                      : "text-white/50 hover:text-white/80 py-2 hover:bg-white/5"
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
                      <Icon 
                        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                    </div>
                  </motion.div>
                  
                  {/* Label selalu tampil */}
                  <motion.span 
                    className={cn(
                      "text-[9px] sm:text-[10px] font-medium tracking-tight whitespace-nowrap mt-1",
                      isActive ? "text-white" : "text-white/50"
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
      </div>
    </div>
  );
}
