import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Wallet, 
  Gift, 
  LogOut, 
  ChevronRight, 
  Edit, 
  Phone, 
  Mail,
  CreditCard,
  ArrowDownToLine,
  History as HistoryIcon,
  Copy,
  Check,
  X,
  Loader2,
  Settings,
  ArrowUpRight,
  Users,
  QrCode,
  Banknote,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { FloatingNav } from '@/components/buyer/FloatingNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import osercLogo from '@/assets/oserc.svg';

export default function BuyerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, profileId } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);
  const [showReferralHistory, setShowReferralHistory] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    domicile_id: '',
    bank_id: '',
    bank_account_name: '',
    bank_account_number: '',
  });
  
  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['buyer-profile-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select(`
          *,
          domiciles:domicile_id (id, name, city),
          banks:bank_id (id, name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      
      // Add dummy balance if no real data or balance is 0
      if (data && (!data.commission_balance || data.commission_balance === 0)) {
        return {
          ...data,
          commission_balance: 250000, // Dummy available balance
          commission_pending: 75000,  // Dummy pending balance
        };
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

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

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['referral-commissions', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('referral_commissions')
        .select(`
          *,
          buyer:buyer_id (full_name),
          orders:order_id (order_number)
        `)
        .eq('referrer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      
      // Return dummy data if no real data
      if (!data || data.length === 0) {
        return [
          {
            id: 'dummy-1',
            commission_type: 'accrual',
            amount: 15000,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            buyer: { full_name: 'Ahmad Rizki' },
            orders: { order_number: 'ORD-2024-001' }
          },
          {
            id: 'dummy-2',
            commission_type: 'accrual',
            amount: 25000,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            buyer: { full_name: 'Siti Nurhaliza' },
            orders: { order_number: 'ORD-2024-002' }
          },
          {
            id: 'dummy-3',
            commission_type: 'accrual',
            amount: 18000,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            buyer: { full_name: 'Budi Santoso' },
            orders: { order_number: 'ORD-2024-003' }
          },
          {
            id: 'dummy-4',
            commission_type: 'reversal',
            amount: 15000,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            buyer: { full_name: 'Ahmad Rizki' },
            orders: { order_number: 'ORD-2024-001' }
          },
          {
            id: 'dummy-5',
            commission_type: 'accrual',
            amount: 30000,
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            buyer: { full_name: 'Dewi Lestari' },
            orders: { order_number: 'ORD-2024-004' }
          },
        ];
      }
      
      return data || [];
    },
    enabled: !!profileId,
  });

  // Count unique referrals
  const { data: referralCount } = useQuery({
    queryKey: ['referral-count', profileId],
    queryFn: async () => {
      if (!profileId) return 0;
      const { count, error } = await supabase
        .from('buyer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', profileId);
      if (error) throw error;
      
      // Return dummy count if no real data
      return count || 3;
    },
    enabled: !!profileId,
  });

  const { data: payoutRequests, isLoading: payoutsLoading } = useQuery({
    queryKey: ['payout-requests', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      
      // Return dummy data if no real data
      if (!data || data.length === 0) {
        return [
          {
            id: 'payout-dummy-1',
            amount: 100000,
            status: 'completed',
            bank_name: 'Bank BCA',
            account_number: '1234567890',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'payout-dummy-2',
            amount: 150000,
            status: 'pending',
            bank_name: 'Bank Mandiri',
            account_number: '9876543210',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'payout-dummy-3',
            amount: 75000,
            status: 'approved',
            bank_name: 'Bank BRI',
            account_number: '5555666677',
            created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'payout-dummy-4',
            amount: 50000,
            status: 'rejected',
            bank_name: 'Bank BNI',
            account_number: '1111222233',
            created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            rejection_reason: 'Data rekening tidak sesuai',
          },
          {
            id: 'payout-dummy-5',
            amount: 200000,
            status: 'completed',
            bank_name: 'Bank BCA',
            account_number: '1234567890',
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'payout-dummy-6',
            amount: 120000,
            status: 'cancelled',
            bank_name: 'Bank Mandiri',
            account_number: '9876543210',
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            rejection_reason: 'Dibatalkan oleh pengguna',
          },
        ];
      }
      
      return data || [];
    },
    enabled: !!profileId,
  });

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        domicile_id: profile.domicile_id || '',
        bank_id: profile.bank_id || '',
        bank_account_name: profile.bank_account_name || '',
        bank_account_number: profile.bank_account_number || '',
      });
    }
  }, [profile]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Berhasil logout',
      description: 'Sampai jumpa kembali!',
    });
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      toast({
        title: 'Tersalin!',
        description: 'Kode referral berhasil disalin',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!profileId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('buyer_profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          domicile_id: editForm.domicile_id || null,
          bank_id: editForm.bank_id || null,
          bank_account_name: editForm.bank_account_name || null,
          bank_account_number: editForm.bank_account_number || null,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Profil diperbarui',
        description: 'Data profil Anda berhasil disimpan',
      });
      
      queryClient.invalidateQueries({ queryKey: ['buyer-profile-full'] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRequestPayout = async () => {
    if (!profileId || !profile) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Jumlah tidak valid',
        description: 'Masukkan jumlah yang valid',
        variant: 'destructive',
      });
      return;
    }

    if (amount > (profile.commission_balance || 0)) {
      toast({
        title: 'Saldo tidak cukup',
        description: 'Jumlah melebihi saldo tersedia',
        variant: 'destructive',
      });
      return;
    }

    if (!profile.bank_id || !profile.bank_account_number || !profile.bank_account_name) {
      toast({
        title: 'Data bank belum lengkap',
        description: 'Lengkapi data bank di profil Anda terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const bankName = banks?.find(b => b.id === profile.bank_id)?.name || '';
      
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          buyer_id: profileId,
          amount,
          bank_name: bankName,
          account_number: profile.bank_account_number,
          account_name: profile.bank_account_name,
        });

      if (error) throw error;

      toast({
        title: 'Permintaan dikirim',
        description: 'Permintaan penarikan sedang diproses',
      });
      
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-profile-full'] });
      setPayoutAmount('');
      setIsPayoutOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim permintaan',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCommissionTypeLabel = (type: string) => {
    switch (type) {
      case 'accrual': return 'NETN';
      case 'reversal': return 'Pembatalan';
      case 'payout': return 'Penarikan';
      default: return type;
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-amber-50 text-amber-700">Menunggu</Badge>;
      case 'approved': return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Disetujui</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-50 text-green-700">Selesai</Badge>;
      case 'rejected': return <Badge variant="secondary" className="bg-red-50 text-red-700">Ditolak</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="bg-gray-50 text-gray-700">Dibatalkan</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate total balance (available + pending)
  const totalBalance = (profile?.commission_balance || 0) + (profile?.commission_pending || 0);

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Dark Header Section */}
      <div className="bg-[#111111] text-white rounded-b-[32px] px-5 pb-8" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Profile Info Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <img 
                src={osercLogo} 
                alt="Profile"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h2 className="font-semibold text-base">{profile?.full_name || 'User'}</h2>
              <p className="text-xs text-gray-400">{profile?.phone || user?.email}</p>
            </div>
          </div>
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="overflow-y-auto rounded-t-[32px] h-auto max-h-[85vh] px-5" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="mx-auto w-10 h-1.5 rounded-full bg-gray-200 mb-4 mt-2" />
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-lg font-semibold">Edit Profil</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Profile Info Section */}
                <fieldset className="space-y-2.5">
                  <legend className="sr-only">Informasi Pribadi</legend>
                  
                  <div className="space-y-1">
                    <Label htmlFor="full_name" className="text-xs text-gray-500">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Nama lengkap"
                      className="rounded-full h-10 text-sm"
                      autoComplete="name"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs text-gray-500">No. Telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="rounded-full h-10 text-sm"
                      autoComplete="tel"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="domicile" className="text-xs text-gray-500">Domisili</Label>
                    <Select
                      name="domicile_id"
                      value={editForm.domicile_id}
                      onValueChange={(value) => handleInputChange('domicile_id', value)}
                    >
                      <SelectTrigger id="domicile" className="rounded-full h-10 text-sm">
                        <SelectValue placeholder="Pilih domisili" />
                      </SelectTrigger>
                      <SelectContent>
                        {domiciles?.length === 0 ? (
                          <SelectItem value="" disabled>Tidak ada data</SelectItem>
                        ) : (
                          domiciles?.map((dom) => (
                            <SelectItem key={dom.id} value={dom.id}>
                              {dom.name} {dom.city && `- ${dom.city}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>
                
                {/* Bank Info Section */}
                <fieldset className="space-y-2.5 pt-1">
                  <legend className="text-xs font-medium text-gray-900 flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Informasi Bank
                  </legend>
                  
                  <div className="space-y-1">
                    <Label htmlFor="bank" className="text-xs text-gray-500">Bank</Label>
                    <Select
                      name="bank_id"
                      value={editForm.bank_id}
                      onValueChange={(value) => handleInputChange('bank_id', value)}
                    >
                      <SelectTrigger id="bank" className="rounded-full h-10 text-sm">
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks?.length === 0 ? (
                          <SelectItem value="" disabled>Tidak ada data</SelectItem>
                        ) : (
                          banks?.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="bank_account_number" className="text-xs text-gray-500">No. Rekening</Label>
                    <Input
                      id="bank_account_number"
                      name="bank_account_number"
                      type="text"
                      inputMode="numeric"
                      value={editForm.bank_account_number}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                      placeholder="Nomor rekening"
                      className="rounded-full h-10 text-sm"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="bank_account_name" className="text-xs text-gray-500">Nama Pemilik Rekening</Label>
                    <Input
                      id="bank_account_name"
                      name="bank_account_name"
                      type="text"
                      value={editForm.bank_account_name}
                      onChange={(e) => handleInputChange('bank_account_name', e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="rounded-full h-10 text-sm"
                      autoComplete="off"
                    />
                  </div>
                </fieldset>

                <Button 
                  type="submit"
                  className="w-full mt-2 bg-[#111111] hover:bg-black text-white rounded-full h-11 text-sm font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Total Balance */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Saldo</p>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              {showBalance ? (
                <Eye className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>
          <h1 className="text-3xl font-bold">
            {showBalance ? formatPrice(totalBalance) : '••••••••'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Sheet open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
            <SheetTrigger asChild>
              <button 
                className="flex-1 bg-white text-black rounded-full py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(profile?.commission_balance || 0) <= 0}
              >
                <ArrowUpRight className="w-4 h-4" />
                Tarik Saldo
              </button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="overflow-y-auto rounded-t-[32px] h-auto max-h-[85vh] px-5" 
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="mx-auto w-10 h-1.5 rounded-full bg-gray-200 mb-4 mt-2" />
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-lg font-semibold">Tarik Saldo NETN</SheetTitle>
                <div className="flex items-center justify-between mt-3 bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500">Saldo Tersedia</span>
                  <span className="text-base font-bold text-[#111111]">
                    {formatPrice(profile?.commission_balance || 0)}
                  </span>
                </div>
              </SheetHeader>

              <div className="space-y-4 pb-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="payout-amount" className="text-xs text-gray-500">Jumlah Penarikan</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                    <Input
                      id="payout-amount"
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0"
                      className="rounded-full h-12 pl-10 text-base font-medium"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[50000, 100000, 250000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPayoutAmount(amount.toString())}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium transition-colors"
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPayoutAmount((profile?.commission_balance || 0).toString())}
                      className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white rounded-full text-xs font-medium transition-colors"
                    >
                      Semua
                    </button>
                  </div>
                </div>

                {/* Bank Info */}
                {profile?.bank_id && profile?.bank_account_number && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Transfer Ke</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-xs">
                        {banks?.find(b => b.id === profile.bank_id)?.name?.substring(5, 8) || 'BNK'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{banks?.find(b => b.id === profile.bank_id)?.name || 'Bank'}</p>
                        <p className="text-xs text-gray-500">{profile.bank_account_number}</p>
                        <p className="text-xs text-gray-500">a.n. {profile.bank_account_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning if bank not complete */}
                {(!profile?.bank_id || !profile?.bank_account_number) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Data Bank Belum Lengkap</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Lengkapi data bank di profil Anda terlebih dahulu untuk melakukan penarikan
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPayoutOpen(false)}
                    className="flex-1 rounded-full h-11 text-sm"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleRequestPayout} 
                    disabled={isSaving || !profile?.bank_id || !profile?.bank_account_number}
                    className="flex-1 rounded-full h-11 bg-[#111111] hover:bg-black text-white text-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Ajukan Penarikan'
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <button 
            onClick={() => setShowWithdrawalHistory(true)}
            className="flex-1 bg-white/10 text-white rounded-full py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm hover:bg-white/20 transition-colors"
          >
            <HistoryIcon className="w-4 h-4" />
            Riwayat
          </button>
        </div>
      </div>

      {/* White Content Section */}
      <div className="px-5 pt-6">
        {/* Available & Pending Commission */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Saldo Tersedia</p>
            <p className="text-lg font-semibold">
              {showBalance ? formatPrice(profile?.commission_balance || 0) : '••••••'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tertunda</p>
            <p className="text-lg font-semibold text-gray-400">
              {showBalance ? formatPrice(profile?.commission_pending || 0) : '••••••'}
            </p>
          </div>
        </div>

        {/* Referral History Button */}
        {!showWithdrawalHistory && !showReferralHistory && (
          <>
            <button 
              onClick={() => setShowReferralHistory(true)}
              className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 rounded-xl transition-colors border-t border-gray-100"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Riwayat Referral</p>
                <p className="text-xs text-gray-400">
                  {referralCount ? `${referralCount} referral` : 'Lihat riwayat NETN'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            {/* Referral Code */}
            <div className="w-full py-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Kode Referral</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg">
                      {profile?.referral_code || '-'}
                    </code>
                    <button
                      onClick={copyReferralCode}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={!profile?.referral_code}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-center pt-8 pb-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </>
        )}

        {/* History Detail */}
        {showWithdrawalHistory && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setShowWithdrawalHistory(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <p className="font-medium text-sm">History</p>
                <p className="text-xs text-gray-400">Withdrawals & Commissions</p>
              </div>
            </div>
            {/* Withdrawals List */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Withdrawals</p>
              <div className="space-y-3">
                {payoutsLoading ? (
                  <div className="text-center text-gray-400 py-8">Loading...</div>
                ) : payoutRequests?.length === 0 ? (
                  <div className="text-center py-8">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">No withdrawals yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payoutRequests?.map((payout: any) => (
                      <button
                        key={payout.id}
                        onClick={() => navigate(`/buyer/transaction/withdrawal/${payout.id}`, { 
                          state: { transaction: payout } 
                        })}
                        className="w-full bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-bold text-sm">
                            {formatPrice(payout.amount)}
                          </span>
                          {getPayoutStatusBadge(payout.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {payout.bank_name} - {payout.account_number}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(payout.created_at)}
                        </p>
                        {payout.rejection_reason && (
                          <p className="text-xs text-red-500 mt-2">
                            Alasan: {payout.rejection_reason}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Referral History Detail */}
        {showReferralHistory && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setShowReferralHistory(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex-1">
                <p className="font-medium text-sm">Referral History</p>
                <p className="text-xs text-gray-400">
                  {referralCount ? `${referralCount} total referral${referralCount > 1 ? 's' : ''}` : 'View commission history'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {commissionsLoading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : commissions?.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">No referral commissions yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Share your referral code to earn commissions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions?.map((commission: any) => (
                    <button
                      key={commission.id}
                      onClick={() => navigate(`/buyer/transaction/commission/${commission.id}`, { 
                        state: { transaction: commission } 
                      })}
                      className="w-full bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">
                          {getCommissionTypeLabel(commission.commission_type)}
                        </p>
                        <span className={cn(
                          "font-bold text-sm",
                          commission.commission_type === 'accrual' ? 'text-green-600' : 'text-red-500'
                        )}>
                          {commission.commission_type === 'accrual' ? '+' : '-'}
                          {formatPrice(commission.amount)}
                        </span>
                      </div>
                      {commission.buyer?.full_name && (
                        <p className="text-xs text-gray-500">
                          dari {commission.buyer.full_name}
                        </p>
                      )}
                      {commission.orders?.order_number && (
                        <p className="text-xs text-gray-400">
                          Order: {commission.orders.order_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(commission.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
}
