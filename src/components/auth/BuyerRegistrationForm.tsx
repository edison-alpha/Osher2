import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, User, CreditCard, Phone, MapPin, Users, Building2 } from 'lucide-react';
import { buyerRegistrationSchema, BuyerRegistrationForm as FormType } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import { toast } from 'sonner';


interface Bank {
  id: string;
  name: string;
  code: string | null;
}

interface BuyerRegistrationFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function BuyerRegistrationForm({ onSuccess, onSwitchToLogin }: BuyerRegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [banks, setBanks] = useState<Bank[]>([]);
  const { signUp } = useAuth();

  const form = useForm<FormType>({
    resolver: zodResolver(buyerRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      nik: '',
      phone: '',
      address: '',
      referralCode: '',
      bankId: '',
      bankAccountNumber: '',
      bankAccountName: '',
    },
  });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    const banksRes = await supabase.from('banks').select('id, name, code').eq('is_active', true).order('name');
    if (banksRes.data) setBanks(banksRes.data);
  };

  const onSubmit = async (data: FormType) => {
    setIsLoading(true);
    try {
      // Check if NIK already exists
      const { data: existingNik } = await supabase
        .from('buyer_profiles')
        .select('id')
        .eq('nik', data.nik)
        .maybeSingle();

      if (existingNik) {
        toast.error('NIK sudah terdaftar. Silakan gunakan NIK lain.');
        setIsLoading(false);
        return;
      }

      // Find referrer if referral code provided
      let referrerId: string | null = null;
      if (data.referralCode) {
        const { data: referrer } = await supabase
          .from('buyer_profiles')
          .select('id')
          .eq('referral_code', data.referralCode.toUpperCase())
          .maybeSingle();

        if (!referrer) {
          toast.error('Kode referral tidak valid');
          setIsLoading(false);
          return;
        }
        referrerId = referrer.id;
      }

      // Sign up user
      const { data: authData, error: signUpError } = await signUp(data.email, data.password);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Gagal membuat akun. Silakan coba lagi.');
        return;
      }

      // Create buyer profile
      const { error: profileError } = await supabase.from('buyer_profiles').insert({
        user_id: authData.user.id,
        full_name: data.fullName,
        nik: data.nik,
        phone: data.phone,
        address: data.address,
        referrer_id: referrerId,
        bank_id: data.bankId,
        bank_account_number: data.bankAccountNumber,
        bank_account_name: data.bankAccountName,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Gagal membuat profil. Silakan hubungi admin.');
        return;
      }

      // Assign buyer role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'buyer',
      });

      if (roleError) {
        console.error('Role assignment error:', roleError);
      }

      toast.success('Registrasi berhasil! Selamat berbelanja.');
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Daftar Akun Pembeli</h1>
        <p className="mt-2 text-muted-foreground">Lengkapi data diri Anda</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email & Password Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Akun</h3>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="nama@email.com"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 karakter"
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Ulangi password"
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Data Diri
            </h3>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nama sesuai KTP" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="16 digit NIK"
                          maxLength={16}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
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
                    <FormLabel>Nomor Telepon *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="08xxxxxxxxxx"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Masukkan alamat lengkap"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bank Info Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informasi Rekening
            </h3>
            <FormDescription className="text-sm">
              Digunakan untuk pencairan komisi referral
            </FormDescription>

            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Bank *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} {bank.code && `(${bank.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234567890" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik Rekening *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sesuai buku tabungan" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Referral Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kode Referral
            </h3>

            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Referral (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Masukkan kode referral jika ada"
                      className="uppercase"
                      maxLength={8}
                      disabled={isLoading}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Dapatkan keuntungan dengan memasukkan kode referral teman Anda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#111111] hover:bg-black text-white"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daftar Sekarang
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-[#111111] hover:underline"
          >
            Masuk sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
