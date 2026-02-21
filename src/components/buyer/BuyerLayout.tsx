import { ReactNode, useState, useEffect } from 'react';
import { BuyerHeader } from './BuyerHeader';
import { LoadingScreen } from '../shared/LoadingScreen';

interface BuyerLayoutProps {
  children: ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerHeader />
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}
