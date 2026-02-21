import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, Store, ArrowRight, Package, Users, Shield } from "lucide-react";
import osercLogo from "@/assets/oserc.svg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={osercLogo} 
              alt="Osher Shop Logo" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-foreground">Osher Shop</span>
          </div>
          <Link to="/auth">
            <Button variant="default" size="sm" className="gap-2 bg-[#111111] hover:bg-black">
              Masuk <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111]/10 text-[#111111] text-sm font-medium mb-6">
            <Package className="w-4 h-4" />
            Belanja Mudah & Terpercaya
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Selamat Datang di{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-black">
              Osher Shop
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Belanja kebutuhan harian Anda dengan mudah. Tracking pengiriman real-time 
            dan dapatkan komisi dari setiap referral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=register">
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-[#111111] hover:bg-black">
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Kenapa Osher Shop?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Kemudahan berbelanja dengan layanan terbaik untuk Anda
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Pembeli Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-[#111111]/50 hover:shadow-lg hover:shadow-[#111111]/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#111111]/10 flex items-center justify-center mb-4 group-hover:bg-[#111111]/20 transition-colors">
              <ShoppingCart className="w-6 h-6 text-[#111111]" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Belanja Mudah</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Katalog produk lengkap, tracking order real-time, dan program referral untuk komisi.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Katalog produk lengkap
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Tracking order real-time
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Komisi referral
              </li>
            </ul>
          </div>

          {/* Pengiriman Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <Truck className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Pengiriman Cepat</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Kurir terpercaya dengan update status pengiriman secara real-time.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Kurir profesional
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Update status real-time
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Bukti pengantaran
              </li>
            </ul>
          </div>

          {/* Terpercaya Card */}
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aman & Terpercaya</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Transaksi aman dengan konfirmasi pembayaran dan audit trail lengkap.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Pembayaran aman
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Konfirmasi admin
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Riwayat transaksi
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-[#111111]/5 to-[#111111]/10 border border-[#111111]/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#111111]/20 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-[#111111]" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Bergabung Sekarang
              </h3>
              <p className="text-muted-foreground">
                Daftar gratis dan mulai berbelanja dengan berbagai kemudahan di Osher Shop.
              </p>
            </div>
            <div className="shrink-0">
              <Link to="/auth?mode=register">
                <Button className="gap-2 bg-[#111111] hover:bg-black">
                  <Users className="w-4 h-4" />
                  Daftar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/src/assets/oserc.svg" 
                alt="Osher Shop Logo" 
                className="w-8 h-8"
              />
              <span className="font-semibold text-foreground">Osher Shop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Osher Shop. Belanja Mudah & Terpercaya.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
