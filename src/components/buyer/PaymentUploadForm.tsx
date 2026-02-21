import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PaymentUploadFormProps {
  orderId: string;
  orderTotal: number;
  bankInfo?: Record<string, string>;
  onSuccess?: () => void;
}

export function PaymentUploadForm({ orderId, orderTotal, bankInfo, onSuccess }: PaymentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState(orderTotal.toString());
  const [bankId, setBankId] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Pilih file bukti pembayaran');
      if (!bankId) throw new Error('Pilih bank tujuan');
      if (!amount || parseFloat(amount) <= 0) throw new Error('Masukkan jumlah transfer yang valid');

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `${orderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Get bank name
      const selectedBank = banks?.find(b => b.id === bankId);

      // Insert payment confirmation
      const { error: insertError } = await supabase
        .from('payment_confirmations')
        .insert({
          order_id: orderId,
          amount: parseFloat(amount),
          bank_name: selectedBank?.name || '',
          account_number: accountNumber,
          transfer_date: transferDate,
          proof_image_url: publicUrl,
        });

      if (insertError) throw insertError;

      // Update order status to waiting_payment if it's new
      await supabase
        .from('orders')
        .update({ status: 'waiting_payment' })
        .eq('id', orderId)
        .eq('status', 'new');

      return publicUrl;
    },
    onSuccess: () => {
      toast.success('Bukti pembayaran berhasil diupload');
      queryClient.invalidateQueries({ queryKey: ['buyer-order-detail', orderId] });
      setSelectedFile(null);
      setPreviewUrl(null);
      setAccountNumber('');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupload bukti pembayaran');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diperbolehkan');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Bukti Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Admin Bank Info */}
        {bankInfo && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Transfer ke Rekening:
            </h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{bankInfo.admin_bank_name || 'BCA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Rekening</span>
                <span className="font-mono font-medium">{bankInfo.admin_bank_account || '1234567890'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atas Nama</span>
                <span className="font-medium">{bankInfo.admin_bank_holder || 'Osher Shop'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Bank Pengirim
          </Label>
          <Select value={bankId} onValueChange={setBankId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih bank Anda" />
            </SelectTrigger>
            <SelectContent>
              {banks?.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name} {bank.code && `(${bank.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>Jumlah Transfer</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              Rp
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              placeholder="0"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Total pesanan: {formatPrice(orderTotal)}
          </p>
        </div>

        {/* Account Number (optional) */}
        <div className="space-y-2">
          <Label>Nomor Rekening Pengirim (opsional)</Label>
          <Input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Masukkan nomor rekening Anda"
          />
        </div>

        {/* Transfer Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tanggal Transfer
          </Label>
          <Input
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Bukti Transfer
          </Label>
          
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview bukti pembayaran"
                className="w-full rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Klik untuk memilih gambar
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                JPG, PNG maksimal 5MB
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => uploadMutation.mutate()}
          disabled={!selectedFile || !bankId || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Bukti Pembayaran
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
