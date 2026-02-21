import { Link } from 'react-router-dom';
import { ShoppingCart, Store, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

export function BuyerHeader() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/buyer" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
            <Store className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">Osher Shop</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
          </Button>
          <Link to="/buyer/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
