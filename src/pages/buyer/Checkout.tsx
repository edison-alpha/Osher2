import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, CreditCard, Loader2, Copy, Check, Package, Shield, Truck, ChevronRight, Edit, Wallet, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useAdminBankInfo } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * CHECKOUT PAGE - PAYMENT METHOD FEATURE
 * 
 * Status: USING DUMMY DATA
 * 
 * Fitur metode pembayaran sudah diimplementasi dengan 3 opsi:
 * 1. Transfer Bank - Pembayaran via transfer (default)
 * 2. COD - Cash on Delivery, bayar saat terima barang
 * 3. Saldo NETN - Bayar menggunakan saldo NETN (DUMMY: Rp 500.000)
 * 
 * DUMMY DATA:
 * - Saldo NETN: Rp 500.000 (hardcoded, belum dari database)
 * - Payment method disimpan di notes order (belum ada field payment_method)
 * - Pengurangan saldo NETN hanya di-log ke console (belum update database)
 * 
 * TODO - Setelah Migration:
 * 1. Jalankan migration: 20251214000000_add_payment_method.sql
 * 2. Uncomment kode untuk ambil commission_balance dari database
 * 3. Uncomment kode untuk update saldo NETN
 * 4. Ganti notes dengan field payment_method
 */

const checkoutSchema = z.object({
  recipient_name: z.string().min(2, 'Nama penerima minimal 2 karakter').max(100),
  phone: z.string().min(10, 'Nomor telepon tidak valid').max(15).regex(/^[0-9+]+$/, 'Format nomor tidak valid'),
  domicile_id: z.string().min(1, 'Pilih domisili'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(500),
  landmark: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type PaymentMethod = 'transfer' | 'cod' | 'commission';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { user, profileId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{ orderNumber: string; total: number; paymentMethod: PaymentMethod } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const { data: bankInfo } = useAdminBankInfo();

  const { data: domiciles } = useQuery({
    queryKey: ['domiciles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domiciles')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch system settings for shipping cost
  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['shipping_cost_default', 'free_shipping_threshold']);
      
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      return settings;
    },
  });

  const { data: buyerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['buyer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // DUMMY DATA: Saldo NETN untuk testing (nanti akan diambil dari database)
  const commissionBalance = 500000; // Rp 500.000 dummy balance

  // Fetch last used address
  const { data: lastAddress } = useQuery({
    queryKey: ['last-address', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      // Get the latest order for this buyer
      const { data: latestOrder, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (orderError || !latestOrder) return null;
      
      // Get the address for that order
      const { data: address, error: addressError } = await supabase
        .from('order_addresses')
        .select('*')
        .eq('order_id', latestOrder.id)
        .maybeSingle();
      
      if (addressError) return null;
      return address;
    },
    enabled: !!profileId,
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipient_name: '',
      phone: '',
      domicile_id: '',
      address: '',
      landmark: '',
      notes: '',
    },
  });

  // Pre-fill form when buyer profile is loaded
  useEffect(() => {
    if (buyerProfile) {
      form.reset({
        recipient_name: lastAddress?.recipient_name || buyerProfile.full_name || '',
        phone: lastAddress?.phone || buyerProfile.phone || '',
        domicile_id: lastAddress?.domicile_id || buyerProfile.domicile_id || '',
        address: lastAddress?.address || '',
        landmark: lastAddress?.landmark || '',
        notes: lastAddress?.notes || '',
      });
    }
  }, [buyerProfile, lastAddress, form]);

  // Calculate shipping cost from system settings
  const baseShippingCost = systemSettings?.shipping_cost_default 
    ? parseFloat(systemSettings.shipping_cost_default) 
    : 15000;
  
  const freeShippingThreshold = systemSettings?.free_shipping_threshold
    ? parseFloat(systemSettings.free_shipping_threshold)
    : 100000;

  // Check if eligible for free shipping
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : baseShippingCost;
  
  // Admin fee is always 0 (no service fee)
  const adminFee = 0;
  
  const total = subtotal + adminFee + shippingCost;
  const canUseCommission = commissionBalance >= total;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const onSubmit = async (formData: CheckoutForm) => {
    if (!profileId || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Keranjang kosong atau Anda belum login',
        variant: 'destructive',
      });
      return;
    }

    // Validate commission payment
    if (paymentMethod === 'commission' && !canUseCommission) {
      toast({
        title: 'Saldo Tidak Cukup',
        description: 'Saldo NETN Anda tidak mencukupi untuk pembayaran ini',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine initial order status based on payment method
      let initialStatus: 'new' | 'waiting_payment' | 'paid' = 'waiting_payment';
      if (paymentMethod === 'cod') {
        initialStatus = 'new'; // COD orders start as 'new'
      } else if (paymentMethod === 'commission') {
        initialStatus = 'paid'; // Commission payments are immediately paid
      }

      // Create order - order_number is generated by trigger
      // Note: payment_method field will be added in future migration
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: profileId,
          order_number: '', // Will be overwritten by trigger
          subtotal,
          admin_fee: adminFee,
          shipping_cost: shippingCost,
          total,
          status: initialStatus,
          notes: `${formData.notes || ''} [Metode: ${paymentMethod === 'transfer' ? 'Transfer Bank' : paymentMethod === 'cod' ? 'COD' : 'Saldo NETN'}]`.trim(),
        } as any)
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order address
      const { error: addressError } = await supabase
        .from('order_addresses')
        .insert({
          order_id: order.id,
          recipient_name: formData.recipient_name,
          phone: formData.phone,
          domicile_id: formData.domicile_id,
          address: formData.address,
          landmark: formData.landmark || null,
          notes: formData.notes || null,
        });

      if (addressError) throw addressError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_order: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // DUMMY: Commission balance deduction will be implemented after migration
      // For now, we just simulate the payment
      if (paymentMethod === 'commission') {
        console.log('DUMMY: Would deduct', total, 'from commission balance');
        console.log('DUMMY: Current balance:', commissionBalance);
        console.log('DUMMY: New balance would be:', commissionBalance - total);
      }

      setOrderCreated({ orderNumber: order.order_number, total, paymentMethod });
      clearCart();

      toast({
        title: 'Pesanan Berhasil Dibuat!',
        description: `Nomor pesanan: ${order.order_number}`,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Gagal membuat pesanan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Tersalin!',
      description: 'Nomor pesanan berhasil disalin',
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Order Success View
  if (orderCreated) {
    return (
      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '16px' }}>
          <button 
            onClick={() => navigate('/buyer')} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[#111111]">Pesanan Berhasil</h1>
          <div className="w-10 h-10" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#111111] mb-2">Pesanan Berhasil!</h2>
            <p className="text-gray-500 text-xs">
              Terima kasih telah berbelanja di Osher Shop
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Nomor Pesanan</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-base text-[#111111]">{orderCreated.orderNumber}</span>
              <button
                onClick={() => copyToClipboard(orderCreated.orderNumber)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-gray-500 mb-1">Total Pembayaran</p>
            <p className="text-xl font-bold text-[#111111]">
              {formatPrice(orderCreated.total)}
            </p>
          </div>

          {orderCreated.paymentMethod === 'transfer' && (
            <>
              <div className="bg-[#111111] text-white rounded-2xl p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Transfer ke:
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Bank</span>
                    <span className="font-semibold">{bankInfo?.admin_bank_name || 'BCA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">No. Rekening</span>
                    <span className="font-mono font-semibold">{bankInfo?.admin_bank_account || '1234567890'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Atas Nama</span>
                    <span className="font-semibold">{bankInfo?.admin_bank_holder || 'Osher Shop'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-gray-600 bg-blue-50 p-4 rounded-2xl">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p>Setelah transfer, konfirmasi pembayaran melalui halaman detail pesanan Anda.</p>
              </div>
            </>
          )}

          {orderCreated.paymentMethod === 'cod' && (
            <div className="flex items-start gap-3 text-xs text-gray-600 bg-amber-50 p-4 rounded-2xl">
              <Banknote className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p>Pembayaran akan dilakukan saat barang diterima. Siapkan uang pas untuk memudahkan transaksi.</p>
            </div>
          )}

          {orderCreated.paymentMethod === 'commission' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs text-gray-600 bg-green-50 p-4 rounded-2xl">
                <Wallet className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <p>Pembayaran berhasil menggunakan saldo NETN. Pesanan Anda akan segera diproses.</p>
              </div>
              <div className="flex items-start gap-3 text-xs text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <span className="text-base">ℹ️</span>
                <div>
                  <p className="font-semibold mb-1">Mode Demo</p>
                  <p>Fitur pembayaran dengan saldo NETN sedang dalam mode demo. Saldo tidak akan benar-benar terpotong sampai migration database dijalankan.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 pb-6">
            <Button
              onClick={() => navigate('/buyer/catalog')}
              className="flex-1 bg-gray-100 text-[#111111] hover:bg-gray-200 py-5 rounded-2xl font-semibold"
            >
              Belanja Lagi
            </Button>
            <Button
              onClick={() => navigate('/buyer/orders')}
              className="flex-1 bg-[#111111] text-white hover:bg-[#2E2E2E] py-5 rounded-2xl font-semibold"
            >
              Lihat Pesanan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/buyer/cart');
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '16px' }}>
        <button 
          onClick={() => navigate('/buyer/cart')} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111]">Pembayaran</h1>
        <div className="w-10 h-10" />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-32">
            {/* Delivery Address Card */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-[#111111] mt-0.5 shrink-0" />
                <h3 className="font-semibold text-sm text-[#111111] flex-1">Alamat Pengiriman</h3>
                <button
                  type="button"
                  onClick={() => setIsEditAddressOpen(true)}
                  className="text-[#111111] text-sm font-semibold flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity"
                >
                  {form.watch('address') ? (
                    <>
                      <Edit className="w-4 h-4" />
                      Ubah
                    </>
                  ) : (
                    'Atur'
                  )}
                </button>
              </div>
              {form.watch('address') ? (
                <div className="space-y-2 pl-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#111111]">{form.watch('recipient_name')}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">{form.watch('phone')}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {form.watch('address')}
                    {form.watch('landmark') && `, ${form.watch('landmark')}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {domiciles?.find(d => d.id === form.watch('domicile_id'))?.name}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 pl-8">Silakan atur alamat pengiriman Anda</p>
              )}
            </div>

            {/* Products List */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#111111]" />
                <h3 className="font-semibold text-sm text-[#111111] flex-1">Produk Dipesan</h3>
                <span className="text-xs font-medium text-gray-500">{totalItems} item</span>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 rounded-2xl overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <h4 className="text-xs font-medium text-[#111111] line-clamp-2 leading-tight">{item.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                        <span className="text-xs font-bold text-[#111111]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-[#111111] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Metode Pembayaran
              </h3>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <div className="space-y-3">
                  {/* Transfer Bank */}
                  <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-[#111111] transition-colors cursor-pointer">
                    <RadioGroupItem value="transfer" id="transfer" className="mt-0.5" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-[#111111]" />
                        <span className="font-semibold text-sm text-[#111111]">Transfer Bank</span>
                      </div>
                      <p className="text-xs text-gray-500">Transfer ke rekening toko</p>
                    </Label>
                  </div>

                  {/* COD */}
                  <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-[#111111] transition-colors cursor-pointer">
                    <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="w-4 h-4 text-[#111111]" />
                        <span className="font-semibold text-sm text-[#111111]">COD (Bayar di Tempat)</span>
                      </div>
                      <p className="text-xs text-gray-500">Bayar saat barang diterima</p>
                    </Label>
                  </div>

                  {/* Commission Balance */}
                  <div className={`flex items-start space-x-3 bg-white p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                    canUseCommission 
                      ? 'border-gray-200 hover:border-[#111111]' 
                      : 'border-gray-100 opacity-50 cursor-not-allowed'
                  }`}>
                    <RadioGroupItem value="commission" id="commission" className="mt-0.5" disabled={!canUseCommission} />
                    <Label htmlFor="commission" className={`flex-1 ${canUseCommission ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-sm text-[#111111]">Saldo NETN</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">DEMO</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Saldo: {formatPrice(commissionBalance)}
                        {!canUseCommission && ' (Tidak mencukupi)'}
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-[#111111] mb-4">Rincian Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-[#111111]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Ongkos Kirim</span>
                  {shippingCost === 0 ? (
                    <span className="font-semibold text-green-600">GRATIS</span>
                  ) : (
                    <span className="font-semibold text-[#111111]">{formatPrice(shippingCost)}</span>
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Biaya Layanan</span>
                  <span className="font-semibold text-[#111111]">{formatPrice(adminFee)}</span>
                </div>
                {/* Commission Info */}
                {paymentMethod !== 'commission' && (
                  <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-xl -mx-1">
                    <span className="text-green-700 text-xs font-medium flex items-center gap-1">
                      🎁 NETN Anda:
                    </span>
                    <span className="font-bold text-xs text-green-700">
                      +{formatPrice(subtotal * 0.05)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between">
                  <span className="text-sm font-bold text-[#111111]">Total</span>
                  <span className="text-base font-bold text-[#111111]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Fixed Bottom - Checkout Button */}
      <div 
        className="fixed left-0 right-0 max-w-md mx-auto px-6 py-3 bg-white border-t border-gray-100 shadow-lg z-50"
        style={{ 
          bottom: 'max(0px, env(safe-area-inset-bottom))',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || !form.watch('address')}
          className="w-full bg-[#111111] text-white rounded-full font-bold text-sm shadow-lg active:scale-[0.98] transition-all h-16 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            'Buat Pesanan'
          )}
        </Button>
      </div>

      {/* Edit Address Dialog */}
      <Dialog open={isEditAddressOpen} onOpenChange={setIsEditAddressOpen}>
        <DialogContent className="max-w-md mx-auto rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111111]">Alamat Pengiriman</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 grid-cols-2">
                <FormField
                  control={form.control}
                  name="recipient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Nama Penerima</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nama lengkap" 
                          className="bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">No. Telepon</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="08xxxxxxxxxx" 
                          className="bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="domicile_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Kota/Kabupaten</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]">
                          <SelectValue placeholder="Pilih kota" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {domiciles?.map((dom) => (
                          <SelectItem key={dom.id} value={dom.id}>
                            {dom.name} {dom.city && `- ${dom.city}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Alamat Lengkap</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                        className="min-h-[80px] bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="landmark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Patokan (Opsional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dekat masjid, sebelah toko..." 
                        className="bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Catatan untuk kurir..." 
                        className="min-h-[60px] bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-[#111111]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={() => setIsEditAddressOpen(false)}
                className="w-full bg-[#111111] hover:bg-[#2E2E2E] text-white rounded-full font-bold text-lg h-14 shadow-lg active:scale-[0.98] transition-all"
              >
                Simpan Alamat
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
