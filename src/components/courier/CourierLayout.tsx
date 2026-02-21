import { ReactNode } from 'react';
import { Truck } from 'lucide-react';
import { CourierNotifications } from './CourierNotifications';
import { CourierFloatingNav } from './CourierFloatingNav';

interface CourierLayoutProps {
  children: ReactNode;
}

export function CourierLayout({ children }: CourierLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-32">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-4 flex items-center justify-between" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#111111] to-gray-800 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">Osher Kurir</span>
          </div>
          <CourierNotifications />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4">
        {children}
      </main>

      {/* Floating Navigation */}
      <CourierFloatingNav />
    </div>
  );
}
