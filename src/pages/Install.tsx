import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, Download, Check, ArrowLeft, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg">
          <Store className="w-10 h-10 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Install Osher Shop</h1>
          <p className="text-muted-foreground text-sm">
            Pasang aplikasi di perangkat Anda untuk akses lebih cepat dan pengalaman terbaik.
          </p>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <Check className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">Aplikasi sudah terpasang!</p>
            <p className="text-sm text-muted-foreground mt-1">Buka dari home screen Anda.</p>
          </div>
        ) : isIOS ? (
          <div className="p-4 rounded-xl bg-muted border border-border text-left space-y-3">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Smartphone className="w-5 h-5 text-primary" />
              Cara Install di iPhone/iPad
            </div>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di Safari</li>
              <li>Scroll ke bawah dan ketuk <strong>"Add to Home Screen"</strong></li>
              <li>Ketuk <strong>"Add"</strong> untuk mengkonfirmasi</li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <Button size="lg" className="gap-2 w-full" onClick={handleInstall}>
            <Download className="w-5 h-5" />
            Install Sekarang
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              Buka halaman ini di browser Chrome atau Edge untuk menginstall aplikasi.
            </p>
          </div>
        )}

        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Install;
