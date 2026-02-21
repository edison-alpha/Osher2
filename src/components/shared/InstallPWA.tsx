import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if iOS and not standalone
    if (iOS && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-[#111111] mb-1">
                Install Osher Shop
              </h3>
              <p className="text-[12px] text-[#8E8E93] leading-relaxed">
                {isIOS 
                  ? 'Tap tombol Share, lalu pilih "Add to Home Screen"'
                  : 'Install aplikasi untuk pengalaman belanja yang lebih baik'}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstallClick}
              className="w-full mt-3 bg-[#111111] hover:bg-[#2E2E2E] text-white rounded-full h-11 font-semibold text-[13px]"
            >
              Install Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
